export type NodeType = "task" | "subtask" | "step";

export interface PlanNode {
  id: string;
  type: NodeType;
  title: string;
  instruction: string;
  est_minutes: number;
  priority: number;
  dependencies: string[];
  blockers: string[];
  immediate: boolean;
  check_env: string[];
  children: PlanNode[];
}

export interface TimelineEntry {
  id: string;
  start_offset_min: number;
  duration_min: number;
}

export interface SopEntry {
  id: string;
  title: string;
  cue: string;
  est_minutes: number;
}

export interface TaskPlan {
  version: string;
  meta: {
    generated_at: string;
    timebox_hours: number;
    optimize_for: string;
    context: {
      where_am_i: string | null;
      deadline_hint: string | null;
    };
    provider?: string;
  };
  plan: {
    title: string;
    objective: string;
    constraints: string[];
    nodes: PlanNode[];
  };
  timeline: TimelineEntry[];
  sop: SopEntry[];
}

export interface CacheState {
  plans: Record<string, TaskPlan>;
  progress: Record<string, Record<string, "todo" | "doing" | "done">>;
  settings: {
    provider: "qwen" | "openai";
    model: string;
    timebox_hours_default: number;
  };
}

export interface GenerationRequest {
  mode: "free_text" | "template";
  input_text?: string;
  template?: {
    where_am_i?: string;
    what_to_do?: string;
    optimize_for?: "faster" | "clearer" | "easier" | "other";
    deadline_hint?: string;
  };
  preferences?: {
    language?: "zh" | "en";
    max_depth?: number;
    style?: string;
    timebox_hours?: number;
    optimize_for?: string;
  };
}
