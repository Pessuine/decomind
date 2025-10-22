import { callJson } from '../ai/provider-qwen';
import { RuntimeConfig } from '../config/repo';
import { getPrompt } from '../prompts/repo';
import { PROMPT_NAMES } from '../prompts/names';
import { validateActionStep } from '../postrules/validate';
import { ChatMessage } from '../ai/types';
import { ActionStep } from '../postrules/schema';

export type ActionRequestPayload = {
  mode: 'action';
  task: {
    title: string;
    history?: string[];
  };
  prefs?: Record<string, unknown>;
};

export type AiLogger = (input: {
  provider: string;
  model: string;
  promptName: string;
  promptVersion: number;
  latencyMs: number;
  inputTokens: number | null | undefined;
  outputTokens: number | null | undefined;
  responseJson: unknown;
}) => void;

export async function runAction(config: RuntimeConfig, payload: ActionRequestPayload, log?: AiLogger): Promise<ActionStep> {
  const prompt = getPrompt(PROMPT_NAMES.ACTION_STEP);
  const messages: ChatMessage[] = [
    { role: 'system', content: prompt.content },
    {
      role: 'user',
      content: JSON.stringify({
        task: payload.task,
        prefs: payload.prefs ?? {}
      })
    }
  ];

  const result = await callJson<ActionStep>(config, config.model.modelName, messages);
  const validated = validateActionStep(result.json);
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
