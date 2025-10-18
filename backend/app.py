from __future__ import annotations

import datetime as dt
import json
import logging
import threading
import time
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS

from .config import settings
from .models import (
    DecomposeRequest,
    ProviderTestRequest,
    RewriteRequest,
    ensure_timebox,
    ensure_tree_constraints,
    validate_plan_schema,
)
from .prompt_builder import build_messages, build_rewrite_messages
from .provider import ProviderError, provider
from .rule_fallback import Preferences, fallback_plan

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app, origins=settings.allowed_origins, supports_credentials=True)

_rate_lock = threading.Lock()
_rate_buckets: Dict[str, Dict[str, Any]] = {}


def _check_rate_limit(ip: str) -> bool:
    with _rate_lock:
        bucket = _rate_buckets.setdefault(ip, {"tokens": settings.rate_limit_per_minute, "timestamp": time.time()})
        now = time.time()
        elapsed = now - bucket["timestamp"]
        refill = elapsed * settings.rate_limit_per_minute / 60
        bucket["tokens"] = min(settings.rate_limit_per_minute, bucket["tokens"] + refill)
        bucket["timestamp"] = now
        if bucket["tokens"] < 1:
            return False
        bucket["tokens"] -= 1
        return True


@app.route("/healthz", methods=["GET"])
def healthz() -> Any:
    return jsonify({"ok": True, "provider": settings.provider})


@app.route("/api/provider/test", methods=["POST"])
def provider_test() -> Any:
    try:
        payload = ProviderTestRequest.model_validate(request.get_json(force=True))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

    messages = [
        {"role": "system", "content": "You are a ping test"},
        {"role": "user", "content": "reply with {\"pong\": true}"},
    ]
    previous_provider = provider.provider
    provider.provider = payload.provider.upper()
    model_name = "qwen-flash" if payload.provider == "qwen" else "gpt-4o-mini"
    try:
        content = provider.call_llm(messages, model=model_name)
        data = json.loads(content)
    except ProviderError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 502
    except json.JSONDecodeError:
        return jsonify({"ok": False, "error": "Invalid JSON from provider"}), 502
    finally:
        provider.provider = previous_provider

    return jsonify({"ok": data.get("pong") is True, "model": model_name})


@app.route("/api/decompose", methods=["POST"])
def decompose() -> Any:
    if not _check_rate_limit(request.remote_addr or "anonymous"):
        return jsonify({"error": "请求过于频繁，请稍后再试"}), 429

    try:
        payload = DecomposeRequest.model_validate(request.get_json(force=True))
    except Exception as exc:
        logger.warning("Invalid request payload: %s", exc)
        return jsonify({"error": str(exc)}), 400

    request_start = time.perf_counter()
    messages = build_messages(payload.model_dump())

    try:
        content = provider.call_llm(
            messages,
            model="qwen-flash" if settings.provider == "QWEN" else "gpt-4o-mini",
            temperature=0.3,
        )
        plan_dict = json.loads(content)
        validate_plan_schema(plan_dict)
        ensure_tree_constraints(plan_dict, max_depth=payload.preferences.max_depth)
        ensure_timebox(plan_dict)
        plan_dict.setdefault("meta", {}).setdefault("generated_at", dt.datetime.utcnow().isoformat() + "Z")
        plan_dict.setdefault("meta", {}).setdefault("timebox_hours", payload.preferences.timebox_hours)
        plan_dict.setdefault("meta", {}).setdefault("context", {
            "where_am_i": payload.template.where_am_i if payload.template else None,
            "deadline_hint": payload.template.deadline_hint if payload.template else None,
        })
    except (ProviderError, json.JSONDecodeError, ValueError) as exc:
        logger.error("LLM generation failed: %s", exc)
        plan_dict = fallback_plan(
            payload.input_text or (payload.template.what_to_do if payload.template else "临时任务"),
            Preferences(timebox_hours=payload.preferences.timebox_hours),
        )

    duration = time.perf_counter() - request_start
    logger.info("/api/decompose handled in %.2fs", duration)
    return jsonify(plan_dict)


@app.route("/api/rewrite", methods=["POST"])
def rewrite() -> Any:
    if not _check_rate_limit(request.remote_addr or "anonymous"):
        return jsonify({"error": "请求过于频繁，请稍后再试"}), 429

    try:
        payload = RewriteRequest.model_validate(request.get_json(force=True))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

    messages = build_rewrite_messages(payload.model_dump())

    try:
        content = provider.call_llm(
            messages,
            model="qwen-flash" if settings.provider == "QWEN" else "gpt-4o-mini",
            temperature=0.2,
        )
        plan_dict = json.loads(content)
        validate_plan_schema(plan_dict)
    except (ProviderError, json.JSONDecodeError, ValueError) as exc:
        logger.error("Rewrite failed: %s", exc)
        return jsonify({"error": "无法优化当前计划，请稍后再试"}), 502

    ensure_tree_constraints(plan_dict)
    ensure_timebox(plan_dict)
    return jsonify(plan_dict)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=settings.environment != "production")
