from __future__ import annotations

from typing import Any, Dict, List

SCHEMA_SNIPPET = """
{
  "version": "1.0",
  "meta": {
    "generated_at": "ISO-8601",
    "timebox_hours": "number",
    "optimize_for": "faster|clearer|easier|other",
    "context": {
      "where_am_i": "string|null",
      "deadline_hint": "string|null"
    }
  },
  "plan": {
    "title": "string",
    "objective": "string",
    "constraints": ["string"],
    "nodes": [
      {
        "id": "uuid",
        "type": "task|subtask|step",
        "title": "string",
        "instruction": "string",
        "est_minutes": "number",
        "priority": "number",
        "dependencies": ["uuid"],
        "blockers": ["string"],
        "immediate": "boolean",
        "check_env": ["string"],
        "children": []
      }
    ]
  },
  "timeline": [
    {
      "id": "uuid",
      "start_offset_min": "number",
      "duration_min": "number"
    }
  ],
  "sop": [
    {
      "id": "uuid",
      "title": "string",
      "cue": "string",
      "est_minutes": "number"
    }
  ]
}
"""


def build_messages(payload: Dict[str, Any]) -> List[Dict[str, str]]:
    mode = payload.get("mode", "free_text")
    preferences = payload.get("preferences", {})
    language = preferences.get("language", "zh")
    max_depth = preferences.get("max_depth", 3)
    style = preferences.get("style", "action_guidance")
    timebox_hours = preferences.get("timebox_hours", 6)

    system_message = {
        "role": "system",
        "content": (
            "你是行动引导型任务拆解器。"
            "所有输出必须是合法的 JSON，遵循以下 Schema: "
            f"{SCHEMA_SNIPPET}."
            "语言以中文为主，如用户使用英文请保持结构不变。"
            "限定任务树最大层级为"
            f" {max_depth}。"
            "所有步骤使用简短动词短句，instruction 需以引导词开头，例如“好，现在,”。"
            "确保总耗时不超过用户给定的 timebox_hours，若无法满足，在 JSON 中增加 "
            "meta.compression_hint 字段给出压缩建议。"
            "不需要任何额外解释。"
        ),
    }

    if mode == "template":
        template = payload.get("template", {})
        user_content = (
            f"地点: {template.get('where_am_i') or '未提供'}\n"
            f"任务: {template.get('what_to_do') or '未提供'}\n"
            f"优化方向: {template.get('optimize_for') or '未提供'}\n"
            f"截止提示: {template.get('deadline_hint') or '未提供'}\n"
            f"请在 {timebox_hours} 小时内完成，重点风格: {style}。"
        )
    else:
        input_text = payload.get("input_text", "")
        user_content = (
            f"任务描述: {input_text}\n"
            f"偏好语言: {language}\n"
            f"最大层级: {max_depth}\n"
            f"总时限: {timebox_hours} 小时。"
        )

    user_message = {"role": "user", "content": user_content}
    return [system_message, user_message]


def build_rewrite_messages(payload: Dict[str, Any]) -> List[Dict[str, str]]:
    edit_hint = payload.get("edit_hint", "请优化任务结构")
    original_plan = payload.get("original_plan", {})
    system_message = {
        "role": "system",
        "content": (
            "你将收到一个任务计划 JSON，请在保持 Schema 的情况下进行优化。"
            "如果原计划超过时限，请压缩并在 meta.compression_hint 中说明。"
            "确保所有指令以行动引导语气呈现。"
        ),
    }
    user_message = {
        "role": "user",
        "content": f"优化提示: {edit_hint}\n原计划: {original_plan}",
    }
    return [system_message, user_message]
