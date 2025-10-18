import { DecomposeRequest, TaskPlan } from '../types/task';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

const request = async <T>(path: string, options: RequestInit): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || '请求失败');
  }
  return response.json();
};

export const decomposeTask = (payload: DecomposeRequest): Promise<TaskPlan> => {
  return request<TaskPlan>('/api/decompose', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const rewriteTaskPlan = (payload: {
  original_plan: TaskPlan;
  edit_hint: string;
  preferences?: Partial<DecomposeRequest['preferences']>;
}): Promise<TaskPlan> => {
  return request<TaskPlan>('/api/rewrite', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const testProvider = (provider: 'qwen' | 'openai') => {
  return request<{ ok: boolean; model: string }>('/api/provider/test', {
    method: 'POST',
    body: JSON.stringify({ provider: provider.toUpperCase() })
  });
};
