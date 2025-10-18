from __future__ import annotations

import logging
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS
from jsonschema import ValidationError

from backend.config import config
from backend.providers import ProviderError, provider_status
from backend.services.decomposer import decompose, rewrite
from backend.utils.rate_limiter import RateLimiter

logging.basicConfig(level=getattr(logging, config.log_level.upper(), logging.INFO))
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=config.allowed_origins, supports_credentials=True)
rate_limiter = RateLimiter(capacity=config.request_limit_per_minute)


def _client_key() -> str:
    return request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")


@app.before_request
def enforce_rate_limit():
    if request.path.startswith("/api/"):
        if not rate_limiter.is_allowed(_client_key()):
            return jsonify({"error": "请求过于频繁，请稍后再试"}), 429
    return None


@app.route("/healthz", methods=["GET"])
def healthz() -> Any:
    return jsonify({"ok": True})


@app.route("/api/decompose", methods=["POST"])
def api_decompose() -> Any:
    try:
        payload = request.get_json(force=True, silent=False)
        plan = decompose(payload or {})
        return jsonify(plan)
    except ValidationError as exc:
        return jsonify({"error": "生成计划不符合约束", "details": str(exc)}), 502
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except ProviderError as exc:
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled error in /api/decompose")
        return jsonify({"error": "内部错误"}), 500


@app.route("/api/rewrite", methods=["POST"])
def api_rewrite() -> Any:
    data = request.get_json(force=True, silent=False) or {}
    original_plan = data.get("original_plan")
    edit_hint = data.get("edit_hint", "")
    preferences = data.get("preferences")
    if not isinstance(original_plan, dict):
        return jsonify({"error": "original_plan 必须是对象"}), 400

    try:
        plan = rewrite(original_plan, edit_hint, preferences)
        return jsonify(plan)
    except ValidationError as exc:
        return jsonify({"error": "生成计划不符合约束", "details": str(exc)}), 502
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except ProviderError as exc:
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled error in /api/rewrite")
        return jsonify({"error": "内部错误"}), 500


@app.route("/api/provider/test", methods=["POST"])
def api_provider_test() -> Any:
    payload = request.get_json(force=True, silent=False) or {}
    provider = payload.get("provider", config.provider)
    status = provider_status(provider)
    return jsonify(status), (200 if status.get("ok") else 502)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
