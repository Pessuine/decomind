import os
from typing import List


class Settings:
    def __init__(self) -> None:
        self.provider: str = os.getenv("PROVIDER", "QWEN").upper()
        self.qwen_api_key: str | None = os.getenv("QWEN_API_KEY")
        self.qwen_base_url: str | None = os.getenv("QWEN_BASE_URL")
        self.openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
        self.openai_base_url: str | None = os.getenv("OPENAI_BASE_URL")
        self.allowed_origins: List[str] = [
            origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",") if origin.strip()
        ]
        self.request_timeout: float = float(os.getenv("REQUEST_TIMEOUT", "30"))
        self.rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))
        self.environment: str = os.getenv("ENVIRONMENT", "development")


settings = Settings()
