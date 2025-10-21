import OpenAI from 'openai';
import { ChatMessage, JsonResponseFormat, ProviderResponse } from './types';
import { getModelSettings } from '../config/repo';

const DEFAULT_RESPONSE_FORMAT: JsonResponseFormat = { type: 'json_object' };

export async function callJson<T>(
  promptName: string,
  messages: ChatMessage[],
  responseFormat: JsonResponseFormat = DEFAULT_RESPONSE_FORMAT,
): Promise<ProviderResponse<T>> {
  const settings = getModelSettings();
  const client = new OpenAI({
    apiKey: settings.api_key,
    baseURL: settings.api_base,
  });
  const start = Date.now();
  const response = await client.chat.completions.create({
    model: settings.model_name,
    messages,
    temperature: settings.temperature,
    max_tokens: settings.max_tokens,
    response_format: responseFormat,
  });
  const latency = Date.now() - start;
  const text = response.choices?.[0]?.message?.content ?? '';
  try {
    const parsed = JSON.parse(text) as T;
    return {
      json: parsed,
      latencyMs: latency,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? undefined,
        completionTokens: response.usage?.completion_tokens ?? undefined,
      },
    };
  } catch (err) {
    throw new Error('MODEL_FORMAT_ERROR');
  }
}
