import OpenAI from 'openai';
import { JsonCallOptions } from './types.js';
import { decryptApiKey, loadModelConfig } from '../config/repo.js';

let client: OpenAI | null = null;

function ensureClient() {
  if (client) return client;
  const cfg = loadModelConfig();
  client = new OpenAI({
    apiKey: decryptApiKey() || process.env.QWEN_API_KEY,
    baseURL: cfg?.api_base || process.env.QWEN_BASE_URL
  });
  return client;
}

export async function callJson(options: JsonCallOptions) {
  const c = ensureClient();
  const response = await c.chat.completions.create({
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? loadModelConfig()?.temperature ?? 0.6,
    max_tokens: options.max_tokens ?? loadModelConfig()?.max_tokens ?? 256,
    response_format: options.response_format ?? { type: 'json_object' }
  });
  const text = response.choices?.[0]?.message?.content || '';
  if (!text) {
    throw new Error('EMPTY_RESPONSE');
  }
  return { parsed: JSON.parse(text), usage: response.usage };
}
