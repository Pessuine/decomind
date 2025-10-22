import OpenAI from "openai";
import { ConfigRepo } from "../config/repo";
import type { AIMessage, AIResponse } from "./types";

export interface AIProvider {
  callJson<T>(options: { model: string; messages: AIMessage[]; responseFormat?: { type: "json_object" } }): Promise<AIResponse<T>>;
}

export function createAIProvider(configRepo: ConfigRepo): AIProvider {
  return {
    async callJson<T>({ model, messages, responseFormat = { type: "json_object" } }): Promise<AIResponse<T>> {
      const settings = configRepo.getModelSettings();
      if (!settings.api_key_encrypted) {
        throw new Error("MODEL_API_KEY_MISSING");
      }
      const client = new OpenAI({
        baseURL: settings.api_base ?? undefined,
        apiKey: settings.api_key_encrypted ?? undefined
      });
      const started = Date.now();
      const result = await client.chat.completions.create({
        model,
        messages,
        response_format: responseFormat,
        temperature: settings.temperature ?? undefined,
        max_tokens: settings.max_tokens ?? undefined
      });
      const text = result.choices?.[0]?.message?.content ?? "";
      try {
        const parsed = JSON.parse(text) as T;
        return {
          data: parsed,
          raw: result,
          usage: {
            input_tokens: result.usage?.prompt_tokens,
            output_tokens: result.usage?.completion_tokens
          },
          latencyMs: Date.now() - started
        };
      } catch (error) {
        throw new Error("MODEL_FORMAT_ERROR");
      }
    }
  };
}
