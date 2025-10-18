"""Configuration helpers for the Flask application."""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Literal

ProviderLiteral = Literal["QWEN", "OPENAI"]


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""

    provider: ProviderLiteral
    qwen_api_key: str | None
    qwen_base_url: str | None
    openai_api_key: str | None
    openai_base_url: str | None
    request_timeout: float
    max_input_chars: int
    rate_limit_per_minute: int

    @classmethod
    def load(cls) -> "Settings":
        provider = os.getenv("PROVIDER", "QWEN").upper()
        if provider not in {"QWEN", "OPENAI"}:
            provider = "QWEN"
        return cls(
            provider=provider,  # type: ignore[arg-type]
            qwen_api_key=os.getenv("QWEN_API_KEY"),
            qwen_base_url=os.getenv(
                "QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"
            ),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            openai_base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            request_timeout=float(os.getenv("REQUEST_TIMEOUT", "30")),
            max_input_chars=int(os.getenv("MAX_INPUT_CHARS", "2000")),
            rate_limit_per_minute=int(os.getenv("RATE_LIMIT_PER_MIN", "10")),
        )


SETTINGS = Settings.load()
