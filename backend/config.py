import os
from dataclasses import dataclass
from typing import List


@dataclass
class AppConfig:
    provider: str = os.getenv("PROVIDER", "QWEN").upper()
    qwen_api_key: str | None = os.getenv("QWEN_API_KEY")
    qwen_base_url: str | None = os.getenv("QWEN_BASE_URL")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_base_url: str | None = os.getenv("OPENAI_BASE_URL")
    allowed_origins: List[str] = (
        [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",") if origin]
    )
    request_limit_per_minute: int = int(os.getenv("REQUEST_LIMIT_PER_MIN", "10"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    timeout_seconds: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
    enable_fallback: bool = os.getenv("ENABLE_RULE_FALLBACK", "true").lower() == "true"


config = AppConfig()
