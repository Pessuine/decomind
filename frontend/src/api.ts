import { TaskPlan } from './types';

export interface DecomposePayload {
  mode: 'free_text' | 'template';
  input_text?: string;
  template?: {
    where_am_i?: string;
    what_to_do?: string;
    optimize_for?: 'faster' | 'clearer' | 'easier' | 'other' | '';
    deadline_hint?: string;
  };
  preferences: {
    language: 'zh' | 'en';
    max_depth: number;
    style: string;
    timebox_hours: number;
  };
}

export interface RewritePayload {
  original_plan: TaskPlan;
  edit_hint: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(message.error || '请求失败');
  }
  return response.json() as Promise<T>;
}

export async function requestDecompose(payload: DecomposePayload): Promise<TaskPlan> {
  const response = await fetch('/api/decompose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse<TaskPlan>(response);
}

export async function requestRewrite(payload: RewritePayload): Promise<TaskPlan> {
  const response = await fetch('/api/rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse<TaskPlan>(response);
}

export async function providerTest(provider: 'qwen' | 'openai'): Promise<{ ok: boolean; model: string }>
{
  const response = await fetch('/api/provider/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider })
  });
  return handleResponse<{ ok: boolean; model: string }>(response);
}
