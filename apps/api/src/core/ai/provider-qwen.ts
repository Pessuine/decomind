import OpenAI from "openai";
import { AiCallOptions, AiCallResult } from "./types";

const client = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

export async function callJson(options: AiCallOptions): Promise<AiCallResult> {
  const started = Date.now();
  const response = await client.chat.completions.create({
    model: options.model,
    messages: options.messages,
    response_format: options.response_format ?? { type: "json_object" },
    temperature: Number(process.env.TEMPERATURE ?? 0.6),
    max_tokens: Number(process.env.MAX_TOKENS ?? 256)
  });
  const text = response.choices?.[0]?.message?.content ?? "";
  const latencyMs = Date.now() - started;
  const parsed = JSON.parse(text);
  return {
    json: parsed,
    latencyMs,
    usage: {
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens
    }
  };
}
