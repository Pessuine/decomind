from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

import requests

from .config import settings

logger = logging.getLogger(__name__)


class ProviderError(RuntimeError):
    """Raised when the upstream provider fails."""


class LLMProvider:
    QWEN_DEFAULT_BASE = "https://dashscope.aliyuncs.com/compatible-mode"
    OPENAI_DEFAULT_BASE = "https://api.openai.com"

    def __init__(self) -> None:
        self.provider = settings.provider

    def _resolve_endpoint(self) -> str:
        if self.provider == "QWEN":
            base = settings.qwen_base_url or self.QWEN_DEFAULT_BASE
        else:
            base = settings.openai_base_url or self.OPENAI_DEFAULT_BASE
        return base.rstrip("/") + "/v1/chat/completions"

    def _resolve_headers(self) -> Dict[str, str]:
        if self.provider == "QWEN":
            if not settings.qwen_api_key:
                raise ProviderError("Qwen API key is not configured")
            return {"Authorization": f"Bearer {settings.qwen_api_key}", "Content-Type": "application/json"}
        if not settings.openai_api_key:
            raise ProviderError("OpenAI API key is not configured")
        return {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}

    def call_llm(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 2048,
    ) -> str:
        endpoint = self._resolve_endpoint()
        headers = self._resolve_headers()
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }

        logger.debug("Calling LLM %s with payload: %s", endpoint, json.dumps(payload, ensure_ascii=False))
        response = requests.post(endpoint, headers=headers, json=payload, timeout=settings.request_timeout)
        if response.status_code >= 400:
            logger.warning("LLM provider returned error %s: %s", response.status_code, response.text)
            raise ProviderError(f"Provider responded with status {response.status_code}")

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:  # pragma: no cover - defensive
            logger.error("Unexpected provider response structure: %s", data)
            raise ProviderError("Invalid response format from provider") from exc

        if not content:
            raise ProviderError("Provider returned empty content")
        logger.debug("LLM provider raw content: %s", content)
        return content


provider = LLMProvider()
