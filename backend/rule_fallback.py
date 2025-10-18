from __future__ import annotations

import datetime as dt
import uuid
from typing import Any, Dict, List

from pydantic import BaseModel


class Preferences(BaseModel):
    timebox_hours: int = 6


INTRO_STEPS = [
    "好，现在，清空桌面，准备常用工具",
    "好，现在，关闭社交应用，静音手机"
]

CUE_PREFIXES = ["好，现在，", "继续，", "慢一点，", "专注，"]


def _estimate_minutes(total_minutes: int, steps: int) -> List[int]:
    base = max(total_minutes // max(steps, 1), 3)
    return [max(base, 3) for _ in range(steps)]


def _make_step(title: str, instruction: str, minutes: int) -> Dict[str, Any]:
    step_id = str(uuid.uuid4())
    return {
        "id": step_id,
        "type": "step",
        "title": title,
        "instruction": instruction,
        "est_minutes": minutes,
        "priority": 1,
        "dependencies": [],
        "blockers": [],
        "immediate": True,
        "check_env": [],
        "children": [],
    }


def fallback_plan(task_text: str, preferences: Preferences | None = None) -> Dict[str, Any]:
    prefs = preferences or Preferences()
    total_minutes = prefs.timebox_hours * 60

    segments = [seg.strip() for seg in task_text.replace("。", ".").split(".") if seg.strip()]
    if not segments:
        segments = [task_text]

    core_steps = []
    for idx, seg in enumerate(segments[:6], start=1):
        instruction_prefix = CUE_PREFIXES[idx % len(CUE_PREFIXES)]
        title = seg[:12] if seg else f"步骤{idx}"
        core_steps.append((title, f"{instruction_prefix}{seg}" if seg else f"{instruction_prefix}执行步骤"))

    total_steps = len(core_steps) + len(INTRO_STEPS)
    per_step_minutes = _estimate_minutes(total_minutes, total_steps)

    nodes: List[Dict[str, Any]] = []
    for idx, intro in enumerate(INTRO_STEPS):
        nodes.append(_make_step(title=intro[5:17], instruction=intro, minutes=per_step_minutes[idx]))

    for offset, (title, instruction) in enumerate(core_steps, start=len(INTRO_STEPS)):
        minutes = per_step_minutes[offset]
        nodes.append(_make_step(title=title, instruction=instruction, minutes=minutes))

    root_id = str(uuid.uuid4())
    timeline = []
    elapsed = 0
    sop = []
    for node in nodes:
        timeline.append({"id": node["id"], "start_offset_min": elapsed, "duration_min": node["est_minutes"]})
        sop.append({"id": node["id"], "title": node["title"], "cue": node["instruction"], "est_minutes": node["est_minutes"]})
        elapsed += node["est_minutes"]

    plan = {
        "version": "1.0",
        "meta": {
            "generated_at": dt.datetime.utcnow().isoformat() + "Z",
            "timebox_hours": prefs.timebox_hours,
            "optimize_for": "clearer",
            "context": {"where_am_i": None, "deadline_hint": None},
            "provider": "rule-fallback",
        },
        "plan": {
            "title": task_text[:18] or "快速任务计划",
            "objective": "完成用户指定的任务",
            "constraints": [],
            "nodes": [
                {
                    "id": root_id,
                    "type": "task",
                    "title": "任务执行",
                    "instruction": "好，现在，按照步骤执行计划",
                    "est_minutes": sum(node["est_minutes"] for node in nodes),
                    "priority": 1,
                    "dependencies": [],
                    "blockers": [],
                    "immediate": True,
                    "check_env": [],
                    "children": nodes,
                }
            ],
        },
        "timeline": timeline,
        "sop": sop,
    }

    return plan
