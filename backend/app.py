"""Flask application exposing task decomposition endpoints."""
from __future__ import annotations

import json
import logging
import re
import time
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Callable, Dict, Tuple

from flask import Flask, jsonify, request

from .config import SETTINGS
from .fallback import create_rule_plan
from .providers import LLMError, call_llm, provider_status
from .schemas import TASK_JSON_SCHEMA, TaskPlan, validate_task_plan

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)

app = Flask(__name__)


class RateLimiter:
    """Simple in-memory token bucket limiter keyed by remote address."""

    def __init__(self, capacity: int, refill_time: float) -> None:
        self.capacity = capacity
        self.refill_time = refill_time
        self.tokens: Dict[str, Tuple[float, float]] = {}

    def check(self, key: str) -> bool:
        now = time.time()
        tokens, last = self.tokens.get(key, (self.capacity, now))
        delta = now - last
        tokens = min(self.capacity, tokens + delta * (self.capacity / self.refill_time))
        if tokens < 1:
            self.tokens[key] = (tokens, now)
            return False
        self.tokens[key] = (tokens - 1, now)
        return True


def rate_limited(func: Callable[..., Any]) -> Callable[..., Any]:
    limiter = RateLimiter(capacity=SETTINGS.rate_limit_per_minute, refill_time=60)

    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        key = request.remote_addr or "unknown"
        if not limiter.check(key):
            return jsonify({"error": "rate_limited"}), 429
        return func(*args, **kwargs)

    return wrapper


def _sanitize_text(text: str) -> str:
    return text.strip()


SENSITIVE_PATTERN = re.compile(r"(\d{11}|\d{15}|\d{18}[0-9Xx])")


def _contains_sensitive(text: str) -> bool:
    return bool(SENSITIVE_PATTERN.search(text))


def _build_system_prompt(max_depth: int) -> str:
    return f"""
你是行动引导型任务拆解器。
只输出 JSON，不要自然语言解释。
中文任务优先，短句，动词开头，避免模糊词。
限定三层结构（任务→子任务→步骤），或按请求 max_depth={max_depth}。
每个步骤包含：title（≤12字）、instruction（≤30字，含“好，现在,”等引导前缀）、est_minutes、blockers、dependencies、priority、immediate（是否能立刻做）、check_env（先决条件）。
必须符合以下 JSON Schema 片段：
{json.dumps(TASK_JSON_SCHEMA)}
"""


def _build_user_prompt(payload: Dict[str, Any]) -> str:
    mode = payload.get("mode")
    preferences = payload.get("preferences", {})
    max_depth = preferences.get("max_depth", 3)
    timebox_hours = preferences.get("timebox_hours", 6)
    optimize_for = preferences.get("style", "action_guidance")

    if mode == "template":
        template = payload.get("template", {})
        where = template.get("where_am_i")
        task = template.get("what_to_do")
        optimize = template.get("optimize_for")
        deadline = template.get("deadline_hint")
        text = (
            f"我现在在{where}。我要做{task}。我想让任务更{optimize}。"
            f"时间提示：{deadline or '无'}。"
        )
    else:
        text = payload.get("input_text", "")

    text = _sanitize_text(text)
    return (
        f"请把这项任务拆解成可执行的计划，限制在{timebox_hours}小时内完成。"
        f"最大层级 {max_depth}。优化目标：{optimize_for}。用户输入：{text}"
    )


def _enforce_limits(text: str) -> None:
    if len(text) > SETTINGS.max_input_chars:
        raise ValueError("input too long")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _post_process(plan: TaskPlan, *, provider: str) -> TaskPlan:
    plan.setdefault("version", "1.0")
    meta = plan.setdefault("meta", {})
    meta.setdefault("generated_at", _now_iso())
    meta.setdefault("provider", provider)
    return plan


def _llm_generate(payload: Dict[str, Any]) -> TaskPlan:
    preferences = payload.get("preferences", {})
    max_depth = preferences.get("max_depth", 3)
    timebox_hours = preferences.get("timebox_hours", 6)
    optimize_for = preferences.get("optimize_for", "other")
    context = payload.get("template", {}) if payload.get("mode") == "template" else {}

    user_prompt = _build_user_prompt(payload)
    _enforce_limits(user_prompt)
    if _contains_sensitive(user_prompt):
        raise ValueError("input contains potential sensitive data")
    response = call_llm(
        system_prompt=_build_system_prompt(max_depth),
        user_prompt=user_prompt,
        model="qwen-flash" if SETTINGS.provider == "QWEN" else "gpt-4o-mini",
        temperature=0.2,
        max_tokens=2048,
    )
    try:
        data = json.loads(response.text)
    except json.JSONDecodeError as exc:
        LOGGER.error("Failed to parse LLM JSON: %s", exc)
        raise LLMError("LLM returned invalid JSON")

    plan_errors = validate_task_plan(data)
    if plan_errors:
        raise LLMError("LLM output failed schema validation: " + "; ".join(plan_errors))

    return _post_process(data, provider=SETTINGS.provider)


def _fallback_plan(payload: Dict[str, Any]) -> TaskPlan:
    preferences = payload.get("preferences", {})
    timebox_hours = int(preferences.get("timebox_hours", 6))
    template = payload.get("template", {}) if payload.get("mode") == "template" else {}
    context = {
        "where_am_i": template.get("where_am_i"),
        "deadline_hint": template.get("deadline_hint"),
    }
    objective = payload.get("input_text") or template.get("what_to_do") or "完成任务"
    plan = create_rule_plan(
        title=template.get("what_to_do", "临时任务"),
        objective=objective,
        timebox_hours=timebox_hours,
        optimize_for=preferences.get("optimize_for", "other"),
        context=context,
    )
    plan["meta"]["generated_at"] = _now_iso()
    return plan


@app.route("/api/decompose", methods=["POST"])
@rate_limited
def decompose() -> Any:
    payload = request.get_json(force=True, silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "invalid_payload"}), 400

    try:
        plan = _llm_generate(payload)
    except (LLMError, ValueError) as exc:
        LOGGER.warning("LLM generation failed, using fallback: %s", exc)
        plan = _fallback_plan(payload)

    errors = validate_task_plan(plan)
    if errors:
        return jsonify({"error": "schema_violation", "details": errors}), 500

    return jsonify(plan)


@app.route("/api/rewrite", methods=["POST"])
@rate_limited
def rewrite() -> Any:
    payload = request.get_json(force=True, silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "invalid_payload"}), 400

    original = payload.get("original_plan")
    edit_hint = payload.get("edit_hint", "")
    if not isinstance(original, dict) or not edit_hint:
        return jsonify({"error": "invalid_payload"}), 400

    try:
        original_json = json.dumps(original)
        hint = _sanitize_text(str(edit_hint))
        if _contains_sensitive(hint):
            return jsonify({"error": "sensitive_hint"}), 400
        user_prompt = (
            "请根据以下原计划调整: "
            + hint
            + " 原始计划 JSON: "
            + original_json
        )
        response = call_llm(
            system_prompt="你是任务计划优化助手，只输出 JSON。" + json.dumps(TASK_JSON_SCHEMA),
            user_prompt=user_prompt,
            model="qwen-flash" if SETTINGS.provider == "QWEN" else "gpt-4o-mini",
            temperature=0.1,
            max_tokens=2048,
        )
        data = json.loads(response.text)
        errors = validate_task_plan(data)
        if errors:
            raise LLMError("schema violation: " + "; ".join(errors))
        plan = _post_process(data, provider=SETTINGS.provider)
    except (LLMError, json.JSONDecodeError) as exc:
        return jsonify({"error": "rewrite_failed", "details": str(exc)}), 502

    return jsonify(plan)


@app.route("/api/provider/test", methods=["POST"])
@rate_limited
def provider_test() -> Any:
    payload = request.get_json(force=True, silent=True) or {}
    provider = payload.get("provider")
    try:
        status = provider_status(provider)
    except Exception as exc:  # pragma: no cover - surface error
        return jsonify({"ok": False, "error": str(exc)}), 500
    return jsonify(status)


@app.route("/healthz", methods=["GET"])
def healthz() -> Any:
    return jsonify({"ok": True})


if __name__ == "__main__":  # pragma: no cover
    app.run(host="0.0.0.0", port=8000)
