import { guideOutlineSchema, GuideRequest } from '@decomind/shared-schemas';
import { callJson } from '../ai/provider-qwen';
import { getPrompt } from '../prompts/repo';
import { ChatMessage } from '../ai/types';
import { ApiError } from '../errors/handler';

export interface GuideResult {
  data: { outline: ReturnType<typeof guideOutlineSchema['parse']>['outline'] };
  latency: number;
  usage?: { promptTokens?: number; completionTokens?: number };
  promptVersion: number;
}

export async function runGuideStrategy(payload: GuideRequest): Promise<GuideResult> {
  const prompt = getPrompt('guide_outline');
  const messages: ChatMessage[] = [
    { role: 'system', content: prompt.content },
    { role: 'user', content: JSON.stringify({ topic: payload.topic, depth: payload.depth }) },
  ];
  try {
    const response = await callJson<{ outline: unknown }>('guide_outline', messages);
    const data = guideOutlineSchema.parse(response.json);
    return { data, latency: response.latencyMs, usage: response.usage, promptVersion: prompt.version };
  } catch (err) {
    if (err instanceof Error && err.message === 'MODEL_FORMAT_ERROR') {
      throw new ApiError('MODEL_FORMAT_ERROR');
    }
    throw err;
  }
}
