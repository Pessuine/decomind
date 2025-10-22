import { callJson } from '../ai/provider-qwen';
import { RuntimeConfig } from '../config/repo';
import { getPrompt } from '../prompts/repo';
import { PROMPT_NAMES, PromptName } from '../prompts/names';
import { validateHelpResponse } from '../postrules/validate';
import { ChatMessage } from '../ai/types';
import { HelpResponse } from '../postrules/schema';
import { AiLogger } from './action';

export type HelpMode = 'simpler' | 'alt' | 'hint' | 'split';

const helpPromptMap: Record<HelpMode, PromptName> = {
  simpler: PROMPT_NAMES.HELP_SIMPLER,
  alt: PROMPT_NAMES.HELP_ALT,
  hint: PROMPT_NAMES.HELP_HINT,
  split: PROMPT_NAMES.HELP_SPLIT
};

export type HelpRequestPayload = {
  mode: 'action';
  action: HelpMode;
  context: {
    current: string;
    task: string;
  };
};

export async function runHelp(
  config: RuntimeConfig,
  payload: HelpRequestPayload,
  log?: AiLogger
): Promise<HelpResponse> {
  const promptName = helpPromptMap[payload.action];
  const prompt = getPrompt(promptName);
  const messages: ChatMessage[] = [
    { role: 'system', content: prompt.content },
    {
      role: 'user',
      content: JSON.stringify({
        current: payload.context.current,
        task: payload.context.task
      })
    }
  ];

  const result = await callJson<HelpResponse>(config, config.model.modelName, messages);
  const validated = validateHelpResponse(result.json);
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
