from __future__ import annotations

import logging
from typing import Any, Dict

import requests

from backend.config import config

logger = logging.getLogger(__name__)


class ProviderError(RuntimeError):
    pass


def _call_qwen(payload: Dict[str, Any]) -> str:
    if not config.qwen_api_key:
        raise ProviderError("QWEN_API_KEY is not configured")

    base_url = config.qwen_base_url or "https://dashscope.aliyuncs.com/compatible-mode/v1"
    url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config.qwen_api_key}",
        "Content-Type": "application/json",
    }
    response = requests.post(url, headers=headers, json=payload, timeout=config.timeout_seconds)
    if response.status_code >= 400:
        logger.error("Qwen error %s: %s", response.status_code, response.text)
        raise ProviderError(f"Qwen API error: {response.text}")
    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise ProviderError("Unexpected Qwen response format") from exc


def _call_openai(payload: Dict[str, Any]) -> str:
    if not config.openai_api_key:
        raise ProviderError("OPENAI_API_KEY is not configured")

    base_url = config.openai_base_url or "https://api.openai.com/v1"
    url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config.openai_api_key}",
        "Content-Type": "application/json",
    }
    response = requests.post(url, headers=headers, json=payload, timeout=config.timeout_seconds)
    if response.status_code >= 400:
        logger.error("OpenAI error %s: %s", response.status_code, response.text)
        raise ProviderError(f"OpenAI API error: {response.text}")
    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise ProviderError("Unexpected OpenAI response format") from exc


def call_llm(
    prompt: str,
    system: str,
    model: str,
    temperature: float,
    max_tokens: int,
    provider_override: str | None = None,
) -> str:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    provider = (provider_override or config.provider).upper()
    if provider == "QWEN":
        return _call_qwen(payload)
    if provider == "OPENAI":
        return _call_openai(payload)
    raise ProviderError(f"Unsupported provider: {config.provider}")


def provider_status(provider: str) -> dict[str, Any]:
    try:
        if provider.upper() == "QWEN":
            call_llm("{\"ping\":true}", "You are a ping responder.", "qwen-flash", 0, 16, provider_override="QWEN")
        else:
            call_llm("{\"ping\":true}", "You are a ping responder.", "gpt-4o-mini", 0, 16, provider_override="OPENAI")
        return {"ok": True, "model": "qwen-flash" if provider.upper() == "QWEN" else "gpt-4o-mini"}
    except Exception as exc:  # noqa: BLE001
        logger.exception("Provider status failed")
        return {"ok": False, "error": str(exc)}
