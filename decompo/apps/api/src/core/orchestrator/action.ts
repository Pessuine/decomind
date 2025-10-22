import { v4 as uuid } from "uuid";
import { ActionStepSchema } from "@decompo/shared-schemas";
import { PromptRepository } from "../prompts/repo";
import { callJson, createQwenClient } from "../ai/provider-qwen";
import { ConfigRepository } from "../config/repo";
import { LoggingRepository } from "../logging/repo";
import { ERROR_CODES } from "../errors/codes";

export class ActionOrchestrator {
  constructor(
    private configRepo: ConfigRepository,
    private promptRepo: PromptRepository,
    private loggingRepo: LoggingRepository
  ) {}

  async nextAction(params: {
    task: { title: string; history: string[] };
    prefs?: any;
    consentImprove?: boolean;
    requestLogId: number;
  }) {
    const start = Date.now();
    const modelConfig = this.configRepo.getModelConfig();
    const prompt = this.promptRepo.getActionStep();
    const requestUuid = uuid();

    if (!modelConfig || !modelConfig.apiKey) {
      const parsed = ActionStepSchema.parse(prompt?.data ?? {});
      return {
        response: parsed,
        meta: {
          request_id: requestUuid,
          latency_ms: Date.now() - start,
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
        content:
          "你是行动推进器，仅返回 JSON。JSON Schema:{\"step\":{\"type\":\"action\",\"text\":string},\"progress\":{\"current\":number,\"total\":number,\"percent\":number},\"menu\":array}",
      },
      {
        role: "user" as const,
        content: `任务:${params.task.title}\n历史:${params.task.history.join(" / ")}`,
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
        const parsed = ActionStepSchema.parse(result);
        if (params.consentImprove) {
          this.loggingRepo.insertAiCall({
            reqId: params.requestLogId,
            provider: modelConfig.provider,
            model: modelConfig.modelName,
            promptName: "action_step",
            promptVersion: prompt?.version ?? 1,
            responseJson: parsed,
          });
        }
        return {
          response: parsed,
          meta: {
            request_id: requestUuid,
            latency_ms: Date.now() - start,
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
