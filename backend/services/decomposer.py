from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

from jsonschema import ValidationError

from backend.config import config
from backend.providers import ProviderError, call_llm
from backend.services import rule_fallback
from backend.utils.validators import detect_sensitive_text, validate_request_length, validate_task_plan

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
你是一名中文行动引导型任务拆解器。请严格输出符合以下 JSON Schema 的 JSON，禁止添加任何额外文字。
Schema摘要：
{
  "version": "1.0",
  "meta": {
    "generated_at": "ISO-8601",
    "timebox_hours": number,
    "optimize_for": "faster|clearer|easier|other",
    "context": {
      "where_am_i": string|null,
      "deadline_hint": string|null
    }
  },
  "plan": {
    "title": string,
    "objective": string,
    "constraints": [string],
    "nodes": [TaskNode]
  },
  "timeline": [{"id": string, "start_offset_min": number, "duration_min": number}],
  "sop": [{"id": string, "title": string, "cue": string, "est_minutes": number}]
}
TaskNode:
{
  "id": string,
  "type": "task"|"subtask"|"step",
  "title": string (<=12字),
  "instruction": string (<=30字，使用行动引导语气，例如“好，现在，”开头),
  "est_minutes": number,
  "priority": number,
  "dependencies": [string],
  "blockers": [string],
  "immediate": boolean,
  "check_env": [string],
  "children": [TaskNode]
}
约束：
- 树状结构最多3层，叶节点 type=step。
- 所有 instruction 短句，避免模糊词。
- 如果预估总时长超过 timebox，则在 plan.constraints 添加压缩建议。
- 总时长需覆盖 timeline 与 sop。
只回复 JSON。
"""


def _build_context_from_template(template: Dict[str, Any]) -> str:
    where = template.get("where_am_i", "")
    task = template.get("what_to_do", "")
    optimize_for = template.get("optimize_for", "")
    deadline = template.get("deadline_hint", "")
    parts = [
        f"场景：{where}" if where else "",
        f"目标：{task}" if task else "",
        f"偏好：希望结果更{optimize_for}" if optimize_for else "",
        f"时间提示：{deadline}" if deadline else "",
    ]
    return "\n".join(filter(None, parts))


def _build_prompt(payload: Dict[str, Any]) -> str:
    mode = payload.get("mode", "free_text")
    prefs = payload.get("preferences", {})
    language = prefs.get("language", "zh")
    timebox_hours = prefs.get("timebox_hours", 6)
    max_depth = prefs.get("max_depth", 3)
    style = prefs.get("style", "action_guidance")

    if mode == "template":
        prompt_body = _build_context_from_template(payload.get("template", {}))
    else:
        prompt_body = payload.get("input_text", "")

    prompt = (
        f"语言：{language}\n"
        f"时间盒：{timebox_hours} 小时\n"
        f"最大层级：{max_depth}\n"
        f"风格：{style}\n"
        "请拆解任务并生成 JSON 计划。\n"
        f"输入任务：{prompt_body}\n"
    )
    return prompt


def _extract_plain_text(payload: Dict[str, Any]) -> str:
    if payload.get("mode") == "template":
        template = payload.get("template", {})
        return " ".join(
            str(template.get(key, ""))
            for key in ("where_am_i", "what_to_do", "optimize_for", "deadline_hint")
        )
    return str(payload.get("input_text", ""))


def _sum_est_minutes(node: Dict[str, Any]) -> float:
    minutes = float(node.get("est_minutes", 0))
    for child in node.get("children", []) or []:
        minutes += _sum_est_minutes(child)
    return minutes


def _collect_nodes(nodes: List[Dict[str, Any]], depth: int = 1) -> List[Dict[str, Any]]:
    collected: List[Dict[str, Any]] = []
    for node in nodes or []:
        collected.append(node)
        if depth > 3:
            raise ValidationError("Tree depth exceeds limit of 3")
        collected.extend(_collect_nodes(node.get("children", []), depth + 1))
    return collected


def _validate_dependencies(nodes: List[Dict[str, Any]]) -> None:
    graph = {node["id"]: set(node.get("dependencies", [])) for node in nodes}

    visited: Dict[str, int] = {}

    def visit(node_id: str) -> None:
        state = visited.get(node_id, 0)
        if state == 1:
            raise ValidationError(f"Detected dependency cycle at {node_id}")
        if state == 2:
            return
        visited[node_id] = 1
        for dep in graph.get(node_id, []):
            if dep in graph:
                visit(dep)
        visited[node_id] = 2

    for node_id in graph:
        visit(node_id)


def _ensure_timebox(plan: Dict[str, Any], timebox_hours: float) -> None:
    nodes = plan.get("plan", {}).get("nodes", [])
    total = 0.0
    for node in nodes:
        total += _sum_est_minutes(node)
    allowed = timebox_hours * 60
    if total > allowed > 0:
        plan["plan"].setdefault("constraints", []).append(
            f"预计时长约 {int(total)} 分钟，超过时间盒 {int(allowed)} 分钟，请压缩或合并步骤"
        )


def decompose(payload: Dict[str, Any]) -> Dict[str, Any]:
    plain_text = _extract_plain_text(payload)
    if not validate_request_length(plain_text):
        raise ValueError("输入不能为空且长度需小于限制")
    if detect_sensitive_text(plain_text):
        raise ValueError("检测到可能的敏感信息，请修改后再试")

    prefs = payload.get("preferences", {})
    timebox_hours = float(prefs.get("timebox_hours", 6))
    optimize_for = prefs.get("optimize_for", "faster")
    context = {
        "where_am_i": payload.get("template", {}).get("where_am_i") if payload.get("mode") == "template" else None,
        "deadline_hint": payload.get("template", {}).get("deadline_hint") if payload.get("mode") == "template" else None,
    }

    prompt = _build_prompt(payload)

    try:
        raw = call_llm(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            model="qwen-flash" if config.provider.upper() == "QWEN" else "gpt-4o-mini",
            temperature=0.2,
            max_tokens=1800,
        )
        plan = json.loads(raw)
        validate_task_plan(plan)
        nodes = _collect_nodes(plan.get("plan", {}).get("nodes", []))
        _validate_dependencies(nodes)
        _ensure_timebox(plan, timebox_hours)
        return plan
    except (ProviderError, json.JSONDecodeError, ValidationError, ValueError) as exc:
        logger.warning("Falling back to rule engine: %s", exc)
        if not config.enable_fallback:
            raise
        fallback_plan = rule_fallback.generate_plan(plain_text, timebox_hours, optimize_for, context)
        validate_task_plan(fallback_plan)
        return fallback_plan


def rewrite(original_plan: Dict[str, Any], edit_hint: str, preferences: Dict[str, Any] | None = None) -> Dict[str, Any]:
    preferences = preferences or {}
    timebox_hours = float(preferences.get("timebox_hours", original_plan.get("meta", {}).get("timebox_hours", 6)))
    optimize_for = preferences.get("optimize_for", original_plan.get("meta", {}).get("optimize_for", "faster"))

    prompt = (
        "请根据以下任务计划 JSON 进行改写，使其更符合提示要求，同时保持 Schema 一致。"
        "必须输出严格 JSON，不要额外说明。\n"
        f"提示：{edit_hint or '保持结构，优化表述'}\n"
        f"原始计划：\n{json.dumps(original_plan, ensure_ascii=False)}"
    )

    try:
        raw = call_llm(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            model="qwen-flash" if config.provider.upper() == "QWEN" else "gpt-4o-mini",
            temperature=0.2,
            max_tokens=1800,
        )
        plan = json.loads(raw)
        validate_task_plan(plan)
        nodes = _collect_nodes(plan.get("plan", {}).get("nodes", []))
        _validate_dependencies(nodes)
        _ensure_timebox(plan, timebox_hours)
        return plan
    except (ProviderError, json.JSONDecodeError, ValidationError, ValueError) as exc:
        logger.warning("Rewrite failed, returning fallback: %s", exc)
        if not config.enable_fallback:
            raise
        fallback_plan = rule_fallback.generate_plan(
            original_plan.get("plan", {}).get("title", "快速任务"),
            timebox_hours,
            optimize_for,
            original_plan.get("meta", {}).get("context", {}),
        )
        validate_task_plan(fallback_plan)
        return fallback_plan
