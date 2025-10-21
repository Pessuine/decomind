import { actionResponseSchema, ActionResponse, HelpRequest } from '@decomind/shared-schemas';
import { callJson } from '../ai/provider-qwen';
import { getPrompt } from '../prompts/repo';
import { ChatMessage } from '../ai/types';
import { ApiError } from '../errors/handler';

const ACTION_TO_PROMPT: Record<HelpRequest['action'], string> = {
  simpler: 'help_simpler',
  alt: 'help_alt',
  hint: 'help_hint',
  split: 'help_split',
};

export interface HelpResult {
  data: ActionResponse;
  latency: number;
  usage?: { promptTokens?: number; completionTokens?: number };
  promptVersion: number;
}

export async function runHelpStrategy(payload: HelpRequest): Promise<HelpResult> {
  const promptName = ACTION_TO_PROMPT[payload.action];
  const prompt = getPrompt(promptName);
  const messages: ChatMessage[] = [
    { role: 'system', content: prompt.content },
    { role: 'user', content: JSON.stringify(payload.context) },
  ];
  try {
    const response = await callJson<ActionResponse>(promptName, messages);
    const data = actionResponseSchema.parse(response.json);
    return { data, latency: response.latencyMs, usage: response.usage, promptVersion: prompt.version };
  } catch (err) {
    if (err instanceof Error && err.message === 'MODEL_FORMAT_ERROR') {
      throw new ApiError('MODEL_FORMAT_ERROR');
    }
    throw err;
  }
}
