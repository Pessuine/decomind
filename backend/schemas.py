"""JSON schema definitions and validation helpers."""
from __future__ import annotations

from typing import Any, Dict, TypedDict

from jsonschema import Draft202012Validator


class TimelineEntry(TypedDict):
    id: str
    start_offset_min: int
    duration_min: int


class SopEntry(TypedDict):
    id: str
    title: str
    cue: str
    est_minutes: int


class Node(TypedDict, total=False):
    id: str
    type: str
    title: str
    instruction: str
    est_minutes: int
    priority: int
    dependencies: list[str]
    blockers: list[str]
    immediate: bool
    check_env: list[str]
    children: list["Node"]


class Plan(TypedDict):
    title: str
    objective: str
    constraints: list[str]
    nodes: list[Node]


class TaskPlan(TypedDict, total=False):
    version: str
    meta: Dict[str, Any]
    plan: Plan
    timeline: list[TimelineEntry]
    sop: list[SopEntry]


TASK_JSON_SCHEMA: Dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "required": ["version", "meta", "plan", "timeline", "sop"],
    "properties": {
        "version": {"type": "string"},
        "meta": {
            "type": "object",
            "required": ["generated_at", "timebox_hours", "optimize_for", "context"],
            "properties": {
                "generated_at": {"type": "string"},
                "timebox_hours": {"type": "number", "minimum": 0},
                "optimize_for": {"type": "string"},
                "context": {
                    "type": "object",
                    "properties": {
                        "where_am_i": {"type": ["string", "null"]},
                        "deadline_hint": {"type": ["string", "null"]},
                    },
                },
            },
        },
        "plan": {
            "type": "object",
            "required": ["title", "objective", "constraints", "nodes"],
            "properties": {
                "title": {"type": "string"},
                "objective": {"type": "string"},
                "constraints": {"type": "array", "items": {"type": "string"}},
                "nodes": {
                    "type": "array",
                    "items": {"$ref": "#/definitions/node"},
                },
            },
        },
        "timeline": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "start_offset_min", "duration_min"],
                "properties": {
                    "id": {"type": "string"},
                    "start_offset_min": {"type": "number"},
                    "duration_min": {"type": "number"},
                },
            },
        },
        "sop": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "title", "cue", "est_minutes"],
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "cue": {"type": "string"},
                    "est_minutes": {"type": "number"},
                },
            },
        },
    },
    "definitions": {
        "node": {
            "type": "object",
            "required": [
                "id",
                "type",
                "title",
                "instruction",
                "est_minutes",
                "priority",
                "dependencies",
                "blockers",
                "immediate",
                "check_env",
                "children",
            ],
            "properties": {
                "id": {"type": "string"},
                "type": {"type": "string", "enum": ["task", "subtask", "step"]},
                "title": {"type": "string"},
                "instruction": {"type": "string"},
                "est_minutes": {"type": "number", "minimum": 0},
                "priority": {"type": "number"},
                "dependencies": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "blockers": {"type": "array", "items": {"type": "string"}},
                "immediate": {"type": "boolean"},
                "check_env": {"type": "array", "items": {"type": "string"}},
                "children": {
                    "type": "array",
                    "items": {"$ref": "#/definitions/node"},
                },
            },
        }
    },
}


_validator = Draft202012Validator(TASK_JSON_SCHEMA)


def validate_task_plan(plan: Dict[str, Any]) -> list[str]:
    """Validate a task plan against the schema and return a list of errors."""

    errors = sorted(_validator.iter_errors(plan), key=lambda e: e.path)
    return [f"{'/'.join(str(p) for p in err.path)}: {err.message}" for err in errors]
