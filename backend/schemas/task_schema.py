TASK_PLAN_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
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
                "provider": {"type": "string"},
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
                "constraints": {
                    "type": "array",
                    "items": {"type": "string"},
                },
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
                "blockers": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "immediate": {"type": "boolean"},
                "check_env": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "children": {
                    "type": "array",
                    "items": {"$ref": "#/definitions/node"},
                },
            },
        }
    },
}
