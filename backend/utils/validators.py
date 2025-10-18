import re
from typing import Any

from jsonschema import Draft7Validator, ValidationError

from backend.schemas.task_schema import TASK_PLAN_SCHEMA

SENSITIVE_PATTERNS = [
    re.compile(r"\b\d{11}\b"),  # phone numbers
    re.compile(r"\b\d{17}[\dXx]\b"),  # national ids
]


def detect_sensitive_text(text: str) -> bool:
    return any(pattern.search(text) for pattern in SENSITIVE_PATTERNS)


def validate_request_length(text: str, max_length: int = 2000) -> bool:
    return len(text.strip()) > 0 and len(text) <= max_length


def validate_task_plan(plan: dict[str, Any]) -> None:
    validator = Draft7Validator(TASK_PLAN_SCHEMA)
    errors = sorted(validator.iter_errors(plan), key=lambda e: e.path)
    if errors:
        message = "; ".join(f"{'/'.join(str(p) for p in error.path)}: {error.message}" for error in errors)
        raise ValidationError(message)
