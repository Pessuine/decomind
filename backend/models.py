from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ValidationError, field_validator


class TemplateInput(BaseModel):
    where_am_i: Optional[str] = None
    what_to_do: Optional[str] = None
    optimize_for: Optional[str] = None
    deadline_hint: Optional[str] = None


class PreferencesModel(BaseModel):
    language: str = "zh"
    max_depth: int = Field(default=3, ge=1, le=5)
    style: str = "action_guidance"
    timebox_hours: int = Field(default=6, ge=1, le=24)


class DecomposeRequest(BaseModel):
    mode: str = Field(default="free_text")
    input_text: Optional[str] = None
    template: Optional[TemplateInput] = None
    preferences: PreferencesModel = Field(default_factory=PreferencesModel)

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: str) -> str:
        if value not in {"free_text", "template"}:
            raise ValueError("mode must be free_text or template")
        return value

    @field_validator("input_text")
    @classmethod
    def validate_text(cls, value: Optional[str], info: Dict[str, Any]) -> Optional[str]:
        if info.data.get("mode") == "free_text" and not value:
            raise ValueError("input_text is required when mode is free_text")
        if value and len(value) > 2000:
            raise ValueError("input_text too long")
        return value

    @field_validator("template")
    @classmethod
    def validate_template(cls, value: Optional[TemplateInput], info: Dict[str, Any]) -> Optional[TemplateInput]:
        if info.data.get("mode") == "template" and not value:
            raise ValueError("template payload required for template mode")
        return value


class RewriteRequest(BaseModel):
    original_plan: Dict[str, Any]
    edit_hint: str = Field(default="请优化任务结构", max_length=500)


class ProviderTestRequest(BaseModel):
    provider: str

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, value: str) -> str:
        if value.lower() not in {"qwen", "openai"}:
            raise ValueError("provider must be qwen or openai")
        return value


class TimelineItem(BaseModel):
    id: str
    start_offset_min: int
    duration_min: int


class SopItem(BaseModel):
    id: str
    title: str
    cue: str
    est_minutes: int


class PlanNode(BaseModel):
    id: str
    type: str
    title: str
    instruction: str
    est_minutes: int
    priority: int
    dependencies: List[str] = Field(default_factory=list)
    blockers: List[str] = Field(default_factory=list)
    immediate: bool = True
    check_env: List[str] = Field(default_factory=list)
    children: List["PlanNode"] = Field(default_factory=list)

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if value not in {"task", "subtask", "step"}:
            raise ValueError("invalid node type")
        return value

    @field_validator("children")
    @classmethod
    def validate_children(cls, value: List["PlanNode"], info: Dict[str, Any]) -> List["PlanNode"]:
        node_type = info.data.get("type")
        if node_type == "step" and value:
            raise ValueError("steps cannot have children")
        return value


class PlanModel(BaseModel):
    version: str
    meta: Dict[str, Any]
    plan: Dict[str, Any]
    timeline: List[TimelineItem]
    sop: List[SopItem]


def validate_plan_schema(plan_dict: Dict[str, Any]) -> PlanModel:
    try:
        return PlanModel.model_validate(plan_dict)
    except ValidationError as exc:
        raise ValueError(f"计划结构不合法: {exc}") from exc


def flatten_nodes(nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    flat: List[Dict[str, Any]] = []
    for node in nodes:
        flat.append(node)
        if node.get("children"):
            flat.extend(flatten_nodes(node["children"]))
    return flat


def ensure_tree_constraints(plan: Dict[str, Any], max_depth: int = 3) -> None:
    nodes = plan.get("plan", {}).get("nodes", [])
    if not nodes:
        raise ValueError("plan.nodes is required")

    def walk(node: Dict[str, Any], depth: int) -> None:
        if depth > max_depth:
            raise ValueError("节点层级超过限制")
        node_type = node.get("type")
        children = node.get("children", [])
        if node_type == "step" and children:
            raise ValueError("step 节点不可包含子节点")
        for child in children:
            walk(child, depth + 1)

    for root in nodes:
        if root.get("type") != "task":
            raise ValueError("根节点必须为 task 类型")
        walk(root, 1)

    ids = {node["id"] for node in flatten_nodes(nodes)}
    for node in flatten_nodes(nodes):
        for dep in node.get("dependencies", []):
            if dep not in ids:
                raise ValueError(f"依赖 {dep} 不存在")


def ensure_timebox(plan: Dict[str, Any]) -> None:
    timebox = plan.get("meta", {}).get("timebox_hours")
    if not timebox:
        return
    nodes = flatten_nodes(plan.get("plan", {}).get("nodes", []))
    total_minutes = sum(node.get("est_minutes", 0) for node in nodes if node.get("type") == "step")
    if total_minutes > timebox * 60:
        plan.setdefault("meta", {})["compression_hint"] = "时长超过限制，请考虑压缩或合并步骤"

