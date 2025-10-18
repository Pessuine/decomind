"""LLM provider abstraction for Qwen and OpenAI compatible APIs."""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import requests

from .config import SETTINGS

LOGGER = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Container for LLM responses."""

    text: str
    raw: Dict[str, Any]


class LLMError(RuntimeError):
    """Raised when the upstream LLM returns an error."""


def _build_headers(provider: str) -> Dict[str, str]:
    if provider == "QWEN":
        if not SETTINGS.qwen_api_key:
            raise LLMError("QWEN_API_KEY is not configured")
        return {
            "Authorization": f"Bearer {SETTINGS.qwen_api_key}",
            "Content-Type": "application/json",
        }
    if not SETTINGS.openai_api_key:
        raise LLMError("OPENAI_API_KEY is not configured")
    return {
        "Authorization": f"Bearer {SETTINGS.openai_api_key}",
        "Content-Type": "application/json",
    }


def _build_url(provider: str) -> str:
    base = SETTINGS.qwen_base_url if provider == "QWEN" else SETTINGS.openai_base_url
    if not base:
        raise LLMError("Base URL is not configured for provider")
    return base.rstrip("/") + "/chat/completions"


def call_llm(
    *,
    system_prompt: str,
    user_prompt: str,
    model: str,
    temperature: float = 0.3,
    max_tokens: int = 2048,
) -> LLMResponse:
    """Call the configured LLM provider with OpenAI compatible payload."""

    provider = SETTINGS.provider
    payload = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
    }

    headers = _build_headers(provider)
    url = _build_url(provider)

    LOGGER.debug("Calling LLM provider %s at %s", provider, url)

    response = requests.post(
        url,
        json=payload,
        headers=headers,
        timeout=SETTINGS.request_timeout,
    )
    if response.status_code >= 400:
        LOGGER.error("LLM provider error: %s", response.text)
        raise LLMError(f"LLM request failed with status {response.status_code}")

    data = response.json()
    choices: List[Dict[str, Any]] = data.get("choices", [])
    if not choices:
        LOGGER.error("LLM response missing choices: %s", data)
        raise LLMError("LLM response missing choices")

    message = choices[0].get("message", {})
    content = message.get("content")
    if not isinstance(content, str):
        LOGGER.error("Unexpected LLM message content: %s", message)
        raise LLMError("LLM response missing content")

    return LLMResponse(text=content, raw=data)


def provider_status(provider: Optional[str] = None) -> Dict[str, Any]:
    """Return provider configuration status for health checks."""

    provider = (provider or SETTINGS.provider).upper()
    if provider not in {"QWEN", "OPENAI"}:
        raise ValueError("Unknown provider")

    try:
        headers = _build_headers(provider)
        model = "qwen-flash" if provider == "QWEN" else "gpt-4o-mini"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "ping"},
                {"role": "user", "content": "respond with ok"},
            ],
            "max_tokens": 5,
            "temperature": 0,
        }
        response = requests.post(
            _build_url(provider),
            json=payload,
            headers=headers,
            timeout=min(SETTINGS.request_timeout, 10),
        )
        ok = response.status_code < 400
        model_name = model
    except Exception as exc:  # pragma: no cover - best effort
        LOGGER.exception("Provider status check failed: %s", exc)
        return {"ok": False, "model": None, "error": str(exc)}
    return {"ok": ok, "model": model_name}
