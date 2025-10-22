import { v4 as uuid } from "uuid";
import { GuideOutlineSchema } from "@decompo/shared-schemas";
import { PromptRepository } from "../prompts/repo";
import { ConfigRepository } from "../config/repo";
import { callJson, createQwenClient } from "../ai/provider-qwen";
import { ERROR_CODES } from "../errors/codes";

export class GuideOrchestrator {
  constructor(private configRepo: ConfigRepository, private promptRepo: PromptRepository) {}

  async outline(topic: string, depth: string) {
    const start = Date.now();
    const modelConfig = this.configRepo.getModelConfig();
    const prompt = this.promptRepo.getGuideOutline();
    const requestId = uuid();
    if (!modelConfig || !modelConfig.apiKey) {
      return {
        response: GuideOutlineSchema.parse(prompt?.data ?? {}),
        meta: { latency_ms: Date.now() - start, version: prompt?.version, request_id: requestId },
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
        content:
          "生成 JSON 大纲: {\"outline\":[{\"title\":string,\"steps\":string[],\"children\":[]}]}，必须中文标题，动词开头步骤",
      },
      {
        role: "user" as const,
        content: `主题:${topic}\n深度:${depth}`,
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
          response: GuideOutlineSchema.parse(result),
          meta: { latency_ms: Date.now() - start, version: prompt?.version, request_id: requestId },
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
