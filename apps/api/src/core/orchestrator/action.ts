import { actionResponseSchema, ActionRequest, ActionResponse } from '@decomind/shared-schemas';
import { callJson } from '../ai/provider-qwen';
import { getPrompt } from '../prompts/repo';
import { ChatMessage } from '../ai/types';
import { ApiError } from '../errors/handler';

export interface ActionResult {
  data: ActionResponse;
  latency: number;
  usage?: { promptTokens?: number; completionTokens?: number };
  promptVersion: number;
}

export async function runActionStrategy(payload: ActionRequest): Promise<ActionResult> {
  const prompt = getPrompt('action_step');
  const messages: ChatMessage[] = [
    { role: 'system', content: prompt.content },
    { role: 'user', content: JSON.stringify({ task: payload.task, prefs: payload.prefs ?? {} }) },
  ];
  try {
    const response = await callJson<ActionResponse>('action_step', messages);
    const data = actionResponseSchema.parse(response.json);
    return { data, latency: response.latencyMs, usage: response.usage, promptVersion: prompt.version };
  } catch (err) {
    if (err instanceof Error && err.message === 'MODEL_FORMAT_ERROR') {
      throw new ApiError('MODEL_FORMAT_ERROR');
    }
    throw err;
  }
}
