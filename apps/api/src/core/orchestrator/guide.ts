import { callJson } from '../ai/provider-qwen.js';
import { getPrompt } from '../prompts/repo.js';
import { validateGuideResponse } from '../postrules/validate.js';
import { loadModelConfig } from '../config/repo.js';
import { GuideRequest } from '@decomind/shared-schemas';

export async function createGuideOutline(input: GuideRequest) {
  const model = loadModelConfig();
  const prompt = getPrompt('guide_outline');
  if (!prompt) throw new Error('PROMPT_NOT_FOUND');
  const messages = [
    JSON.parse(prompt.content),
    {
      role: 'user' as const,
      content: JSON.stringify(input)
    }
  ];
  const { parsed: raw, usage } = await callJson({ model: model.model_name, messages, max_tokens: 512 });
  const parsed = validateGuideResponse(raw);
  return { payload: parsed, promptVersion: prompt.version, usage };
}
