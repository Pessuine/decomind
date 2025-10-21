import { callJson } from '../ai/provider-qwen.js';
import { getPrompt } from '../prompts/repo.js';
import { validateActionResponse } from '../postrules/validate.js';
import { loadModelConfig } from '../config/repo.js';
import { ExecuteRequest } from '@decomind/shared-schemas';

export async function createActionStep(input: ExecuteRequest) {
  const model = loadModelConfig();
  const prompt = getPrompt('action_step');
  if (!prompt) {
    throw new Error('PROMPT_NOT_FOUND');
  }
  const messages = [
    JSON.parse(prompt.content),
    {
      role: 'user' as const,
      content: JSON.stringify({
        task: input.task,
        preferences: input.prefs,
        history: input.task.history
      })
    }
  ];
  const { parsed: raw, usage } = await callJson({ model: model.model_name, messages });
  const parsed = validateActionResponse(raw);
  if (!parsed.menu) {
    parsed.menu = [
      { key: 'simpler', label: '更简单一点' },
      { key: 'alt', label: '换个做法' },
      { key: 'hint', label: '给个快速提示' },
      { key: 'split', label: '分更小一步' }
    ];
  }
  return { payload: parsed, promptVersion: prompt.version, usage };
}
