"""Rule based fallback decomposition when LLM is unavailable."""
from __future__ import annotations

import math
import uuid
from typing import Dict, List

from .schemas import TaskPlan

ACTION_PREFIXES = ["好，现在，", "继续，", "慢一点，", "接下来，", "专注，"]


def _tokenize(text: str) -> List[str]:
    cleaned = text.replace("，", " ").replace("。", " ")
    parts = [p.strip() for p in cleaned.split() if p.strip()]
    if not parts:
        return ["完成任务"]
    return parts


def _generate_uuid() -> str:
    return str(uuid.uuid4())


def _chunk_steps(parts: List[str], target: int) -> List[str]:
    if not parts:
        return ["准备"],
    size = max(1, math.ceil(len(parts) / target))
    chunks = ["、".join(parts[i : i + size]) for i in range(0, len(parts), size)]
    return chunks[:target]


def create_rule_plan(
    *,
    title: str,
    objective: str,
    timebox_hours: int,
    optimize_for: str,
    context: Dict[str, str | None],
) -> TaskPlan:
    """Generate a plan using heuristic rules."""

    base_steps = ["整理环境", "打开相关资料"]
    main_tokens = _tokenize(objective)
    steps = base_steps + _chunk_steps(main_tokens, 5)

    est_total = timebox_hours * 60
    per_step = max(3, min(15, est_total // max(1, len(steps))))

    nodes = []
    timeline = []
    sop = []
    current_offset = 0

    root_id = _generate_uuid()
    root_node = {
        "id": root_id,
        "type": "task",
        "title": title or objective,
        "instruction": "好，现在，专注于任务目标",
        "est_minutes": est_total,
        "priority": 1,
        "dependencies": [],
        "blockers": [],
        "immediate": True,
        "check_env": [],
        "children": [],
    }

    for idx, step in enumerate(steps):
        step_id = _generate_uuid()
        instruction_prefix = ACTION_PREFIXES[idx % len(ACTION_PREFIXES)]
        instruction = f"{instruction_prefix}{step}"
        node = {
            "id": step_id,
            "type": "step",
            "title": step[:12] or "步骤",
            "instruction": instruction[:60],
            "est_minutes": per_step,
            "priority": idx + 1,
            "dependencies": [root_id] if idx > 0 else [],
            "blockers": [],
            "immediate": True,
            "check_env": ["确认工具齐备"] if idx == 0 else [],
            "children": [],
        }
        root_node["children"].append(node)
        timeline.append(
            {
                "id": step_id,
                "start_offset_min": current_offset,
                "duration_min": per_step,
            }
        )
        sop.append(
            {
                "id": step_id,
                "title": node["title"],
                "cue": instruction[:20],
                "est_minutes": per_step,
            }
        )
        current_offset += per_step

    nodes.append(root_node)

    plan: TaskPlan = {
        "version": "1.0",
        "meta": {
            "generated_at": "",  # filled by caller
            "timebox_hours": timebox_hours,
            "optimize_for": optimize_for,
            "context": {
                "where_am_i": context.get("where_am_i"),
                "deadline_hint": context.get("deadline_hint"),
            },
            "provider": "rule-fallback",
        },
        "plan": {
            "title": title or objective,
            "objective": objective,
            "constraints": ["保持环境整洁", "遵循时间框架"],
            "nodes": nodes,
        },
        "timeline": timeline,
        "sop": sop,
    }
    return plan
