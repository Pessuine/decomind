from __future__ import annotations

import time
import uuid
from typing import Any, Dict

PREFIXES = [
    "好，现在，",
    "继续，",
    "慢一点，",
    "保持专注，",
    "深呼吸一下，然后",
]


def _generate_step(title: str, instruction: str, est_minutes: int, priority: int) -> Dict[str, Any]:
    step_id = str(uuid.uuid4())
    return {
        "id": step_id,
        "type": "step",
        "title": title,
        "instruction": instruction,
        "est_minutes": est_minutes,
        "priority": priority,
        "dependencies": [],
        "blockers": [],
        "immediate": True,
        "check_env": [],
        "children": [],
    }


def _prefix_instruction(prefix_index: int, text: str) -> str:
    prefix = PREFIXES[prefix_index % len(PREFIXES)]
    return f"{prefix}{text}"


def generate_plan(input_text: str, timebox_hours: float, optimize_for: str, context: Dict[str, Any]) -> Dict[str, Any]:
    total_minutes = max(30, int(timebox_hours * 60))
    estimated_steps = 6
    est_minutes = max(3, total_minutes // estimated_steps)

    steps_titles = [
        "清理环境",
        "屏蔽干扰",
        "梳理要点",
        "准备资料",
        "执行核心",
        "收尾总结",
    ]
    steps = []
    for idx, title in enumerate(steps_titles):
        instruction = _prefix_instruction(idx, f"{title}，保持行动")
        steps.append(_generate_step(title, instruction, est_minutes, idx + 1))

    plan_id = str(uuid.uuid4())
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    timeline = []
    offset = 0
    for step in steps:
        timeline.append(
            {
                "id": step["id"],
                "start_offset_min": offset,
                "duration_min": step["est_minutes"],
            }
        )
        offset += step["est_minutes"]

    sop = [
        {
            "id": step["id"],
            "title": step["title"],
            "cue": step["instruction"][:20],
            "est_minutes": step["est_minutes"],
        }
        for step in steps
    ]

    plan = {
        "version": "1.0",
        "meta": {
            "generated_at": now_iso,
            "timebox_hours": timebox_hours,
            "optimize_for": optimize_for,
            "provider": "rule-fallback",
            "context": context,
        },
        "plan": {
            "title": input_text[:20] or "快速任务",
            "objective": "保持节奏完成任务",
            "constraints": ["聚焦当前环境", "分段执行"],
            "nodes": [
                {
                    "id": plan_id,
                    "type": "task",
                    "title": "任务计划",
                    "instruction": "好，现在，按顺序完成以下步骤",
                    "est_minutes": total_minutes,
                    "priority": 1,
                    "dependencies": [],
                    "blockers": [],
                    "immediate": True,
                    "check_env": [],
                    "children": [
                        {
                            "id": str(uuid.uuid4()),
                            "type": "subtask",
                            "title": "执行步骤",
                            "instruction": "好，现在，逐一执行小步骤",
                            "est_minutes": total_minutes,
                            "priority": 1,
                            "dependencies": [],
                            "blockers": [],
                            "immediate": True,
                            "check_env": [],
                            "children": steps,
                        }
                    ],
                }
            ],
        },
        "timeline": timeline,
        "sop": sop,
    }
    return plan
