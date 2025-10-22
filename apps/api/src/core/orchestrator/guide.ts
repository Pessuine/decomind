import { callJson } from '../ai/provider-qwen';
import { RuntimeConfig } from '../config/repo';
import { getPrompt } from '../prompts/repo';
import { PROMPT_NAMES } from '../prompts/names';
import { validateGuideResponse } from '../postrules/validate';
import { ChatMessage } from '../ai/types';
import { GuideResponse } from '../postrules/schema';
import { AiLogger } from './action';

export type GuideRequestPayload = {
  version: number;
  topic: string;
  depth?: string;
};

export async function runGuide(
  config: RuntimeConfig,
  payload: GuideRequestPayload,
  log?: AiLogger
): Promise<GuideResponse> {
  const prompt = getPrompt(PROMPT_NAMES.GUIDE_OUTLINE);
  const messages: ChatMessage[] = [
    { role: 'system', content: prompt.content },
    {
      role: 'user',
      content: JSON.stringify({ topic: payload.topic, depth: payload.depth ?? 'normal' })
    }
  ];
  const result = await callJson<GuideResponse>(config, config.model.modelName, messages);
  const validated = validateGuideResponse(result.json);
  log?.({
    provider: config.model.provider,
    model: config.model.modelName,
    promptName: prompt.name,
    promptVersion: prompt.version,
    latencyMs: result.latencyMs,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    responseJson: validated
  });
  return validated;
}
