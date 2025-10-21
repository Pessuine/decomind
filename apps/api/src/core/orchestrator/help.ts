import { callJson } from '../ai/provider-qwen.js';
import { getPrompt } from '../prompts/repo.js';
import { validateActionResponse } from '../postrules/validate.js';
import { loadModelConfig } from '../config/repo.js';
import { HelpRequest } from '@decomind/shared-schemas';

export async function createHelpStep(input: HelpRequest) {
  const model = loadModelConfig();
  const prompt = getPrompt(`help_${input.action}`);
  if (!prompt) throw new Error('PROMPT_NOT_FOUND');
  const messages = [
    JSON.parse(prompt.content),
    {
      role: 'user' as const,
      content: JSON.stringify({
        context: input.context,
        action: input.action
      })
    }
  ];
  const { parsed: raw } = await callJson({ model: model.model_name, messages });
  const parsed = validateActionResponse(raw);
  parsed.menu = undefined;
  return { payload: parsed, promptVersion: prompt.version };
}
