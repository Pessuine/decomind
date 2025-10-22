import { v4 as uuid } from "uuid";
import { HelpResultSchema } from "@decompo/shared-schemas";
import { PromptRepository } from "../prompts/repo";
import { callJson, createQwenClient } from "../ai/provider-qwen";
import { ConfigRepository } from "../config/repo";
import { ERROR_CODES } from "../errors/codes";

export class HelpOrchestrator {
  constructor(private configRepo: ConfigRepository, private promptRepo: PromptRepository) {}

  async generate(action: "simpler" | "alt" | "hint" | "split", context: { current: string; task: string }) {
    const modelConfig = this.configRepo.getModelConfig();
    const start = Date.now();
    const prompt = this.promptRepo.getHelpPrompt(action);
    const requestId = uuid();
    if (!modelConfig || !modelConfig.apiKey) {
      return {
        response: HelpResultSchema.parse(prompt?.data ?? {}),
        meta: {
          request_id: requestId,
          latency_ms: Date.now() - start,
          version: prompt?.version,
        },
      };
    }

    const client = createQwenClient({
      baseURL: modelConfig.apiBase,
      apiKey: modelConfig.apiKey,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
    });

    const messages = [
      {
        role: "system" as const,
        content: "回答 JSON: {\"step\":{\"type\":\"action\",\"text\":string}}，动词开头，简短",
      },
      {
        role: "user" as const,
        content: `任务:${context.task}\n当前:${context.current}\n需求:${action}`,
      },
    ];

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await callJson(client, {
          model: modelConfig.modelName,
          messages,
          temperature: modelConfig.temperature,
          max_tokens: modelConfig.maxTokens,
        });
        return {
          response: HelpResultSchema.parse(result),
          meta: {
            request_id: requestId,
            latency_ms: Date.now() - start,
            version: prompt?.version,
          },
        };
      } catch (err) {
        if (attempt === 1) {
          const error = new Error("加载失败，请重试");
          (error as any).code = ERROR_CODES.MODEL_FORMAT_ERROR;
          throw error;
        }
      }
    }

    throw new Error("加载失败，请重试");
  }
}
