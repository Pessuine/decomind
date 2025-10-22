import OpenAI from 'openai';
import { RuntimeConfig } from '../config/repo';
import { ChatMessage, ProviderResponse } from './types';

export async function callJson<T>(config: RuntimeConfig, model: string, messages: ChatMessage[]): Promise<ProviderResponse<T>> {
  const client = new OpenAI({
    baseURL: config.model.apiBase,
    apiKey: config.model.apiKey ?? undefined
  });

  const start = Date.now();
  const response = await client.chat.completions.create({
    model,
    messages,
    response_format: { type: 'json_object' },
    temperature: config.model.temperature,
    max_tokens: config.model.maxTokens
  });
  const latencyMs = Date.now() - start;
  const text = response.choices?.[0]?.message?.content ?? '';
  if (!text) {
    throw new Error('Empty response from provider');
  }

  let parsed: T;
  try {
    parsed = JSON.parse(text) as T;
  } catch (error) {
    throw new Error('MODEL_FORMAT_ERROR:' + (error as Error).message);
  }

  return {
    json: parsed,
    latencyMs,
    inputTokens: response.usage?.prompt_tokens ?? null,
    outputTokens: response.usage?.completion_tokens ?? null
  };
}
