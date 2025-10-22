import OpenAI from "openai";

export function createQwenClient(cfg: {
  baseURL: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}) {
  return new OpenAI({ baseURL: cfg.baseURL, apiKey: cfg.apiKey });
}

export async function callJson(
  client: OpenAI,
  params: {
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature: number;
    max_tokens: number;
  }
) {
  const r = await client.chat.completions.create({
    model: params.model,
    messages: params.messages,
    response_format: { type: "json_object" },
    temperature: params.temperature,
    max_tokens: params.max_tokens,
  });
  const text = r.choices?.[0]?.message?.content || "";
  return JSON.parse(text);
}
