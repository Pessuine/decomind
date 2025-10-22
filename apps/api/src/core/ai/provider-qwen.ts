import OpenAI from "openai";
import { ErrorCode } from "../errors/codes.js";
import type { AiCallOptions, AiProvider } from "./types.js";

export class QwenProvider implements AiProvider {
  private client: OpenAI;

  constructor() {
    const baseURL = process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
      throw new Error("QWEN_API_KEY is not set");
    }
    this.client = new OpenAI({
      baseURL,
      apiKey,
    });
  }

  async callJson(options: AiCallOptions): Promise<unknown> {
    try {
      const result = await this.client.chat.completions.create({
        model: options.model,
        messages: options.messages,
        response_format: options.response_format ?? { type: "json_object" },
        temperature: options.temperature ?? Number(process.env.TEMPERATURE || 0.6),
        max_tokens: options.max_tokens ?? Number(process.env.MAX_TOKENS || 256),
      });
      const text = result.choices?.[0]?.message?.content || "";
      return JSON.parse(text);
    } catch (error) {
      const err = error as any;
      if (err instanceof SyntaxError) {
        (err as any).code = ErrorCode.MODEL_FORMAT_ERROR;
        (err as any).statusCode = 502;
      }
      throw err;
    }
  }
}
