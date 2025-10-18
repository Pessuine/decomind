export type NodeType = 'task' | 'subtask' | 'step';

export interface TaskNode {
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
  children: TaskNode[];
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
    optimize_for: 'faster' | 'clearer' | 'easier' | 'other';
    provider?: string;
    context: {
      where_am_i: string | null;
      deadline_hint: string | null;
    };
  };
  plan: {
    title: string;
    objective: string;
    constraints: string[];
    nodes: TaskNode[];
  };
  timeline: TimelineItem[];
  sop: SopItem[];
}

export interface Preferences {
  language: 'zh' | 'en';
  max_depth: number;
  style: 'action_guidance';
  timebox_hours: number;
  optimize_for: 'faster' | 'clearer' | 'easier' | 'other';
}

export type Mode = 'free_text' | 'template';

export interface TemplatePayload {
  where_am_i: string;
  what_to_do: string;
  optimize_for: Preferences['optimize_for'];
  deadline_hint?: string;
}

export interface DecomposeRequest {
  mode: Mode;
  input_text?: string;
  template?: TemplatePayload;
  preferences: Preferences;
}
