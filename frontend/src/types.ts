export type NodeType = 'task' | 'subtask' | 'step';

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

export interface TimelineItem {
  id: string;
  start_offset_min: number;
  duration_min: number;
}

export interface SopItem {
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
    optimize_for: 'faster' | 'clearer' | 'easier' | 'other' | string;
    context: {
      where_am_i: string | null;
      deadline_hint: string | null;
    };
    provider?: string;
    compression_hint?: string;
  } & Record<string, unknown>;
  plan: {
    title: string;
    objective: string;
    constraints: string[];
    nodes: PlanNode[];
  };
  timeline: TimelineItem[];
  sop: SopItem[];
}

export interface Preferences {
  language: 'zh' | 'en';
  max_depth: number;
  style: string;
  timebox_hours: number;
}

export type ProgressState = 'todo' | 'doing' | 'done';

export interface CacheModel {
  plans: Record<string, TaskPlan>;
  progress: Record<string, Record<string, ProgressState>>;
  settings: {
    provider: 'qwen' | 'openai';
    model: string;
    timebox_hours_default: number;
  };
}
