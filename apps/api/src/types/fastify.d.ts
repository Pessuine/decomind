import type { AppDatabase } from "../core/config/database";
import type { RequestLogContext } from "../core/logging/repo";
import type { FastifyRequest } from "fastify";
import type { createAiLogger } from "../core/logging/ai";

declare module "fastify" {
  interface FastifyInstance {
    db: AppDatabase;
    logRequest: (request: FastifyRequest, context: RequestLogContext) => void;
    logAiCall: ReturnType<typeof createAiLogger>;
  }
}
