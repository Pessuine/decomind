import "fastify";
import type { ConfigRepo } from "../core/config/repo";
import type { LoggingRepo } from "../core/logging/repo";
import type { PromptRepo } from "../core/prompts/repo";
import type { AIProvider } from "../core/ai/provider-qwen";
import type { FeedbackRepo } from "../db/feedback";

declare module "fastify" {
  interface FastifyInstance {
    configRepo: ConfigRepo;
    loggingRepo: LoggingRepo;
    promptRepo: PromptRepo;
    aiProvider: AIProvider;
    feedbackRepo: FeedbackRepo;
  }
}
