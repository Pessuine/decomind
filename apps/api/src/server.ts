import Fastify, { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";
import { randomUUID } from "node:crypto";
import { createDb } from "./db/connection";
import { createLoggingRepo } from "./core/logging/repo";
import { createConfigRepo } from "./core/config/repo";
import { createPromptRepo } from "./core/prompts/repo";
import { createAIProvider } from "./core/ai/provider-qwen";
import { registerRoutes } from "./routes";
import { buildErrorHandler } from "./core/errors/handler";
import type { EnvConfig } from "./types/config";
import { createFeedbackRepo } from "./db/feedback";

interface CreateServerOptions {
  config: EnvConfig;
}

export async function createServer({ config }: CreateServerOptions): Promise<FastifyInstance> {
  const db = createDb(config.DB_PATH ?? "runtime/decompo.db");
  const loggingRepo = createLoggingRepo(db, config.HOST_SECRET ?? "decompo-host");
  const configRepo = createConfigRepo(db, config);
  const promptRepo = createPromptRepo(db);
  const aiProvider = createAIProvider(configRepo);
  const feedbackRepo = createFeedbackRepo(db);

  const server = Fastify({
    logger: {
      level: "info"
    },
    genReqId: () => randomUUID()
  });

  await server.register(helmet, { global: true });
  await server.register(cors, { origin: false });
  await server.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute"
  });

  server.decorate("configRepo", configRepo);
  server.decorate("loggingRepo", loggingRepo);
  server.decorate("promptRepo", promptRepo);
  server.decorate("aiProvider", aiProvider);
  server.decorate("feedbackRepo", feedbackRepo);

  server.addHook("onRequest", async (req, reply) => {
    const startedAt = Date.now();
    (req as any).startedAt = startedAt;
    (req as any).isLogged = false;
    (req as any).requestLogId = null;
    (req as any).pendingAiLogs = [];

    const hostHeader = req.headers["host"] ?? "";
    const allowedHosts = configRepo.getAllowedHosts();
    if (!allowedHosts.includes(hostHeader as string) && !hostHeader.toString().startsWith("localhost")) {
      reply.code(403);
      throw new Error("HOST_FORBIDDEN");
    }
  });

  server.setErrorHandler(buildErrorHandler(loggingRepo));

  registerRoutes(server);

  server.addHook("onResponse", async function (req, reply) {
    const startedAt: number = (req as any).startedAt ?? Date.now();
    const latency = Date.now() - startedAt;
    if (!(req as any).isLogged) {
      const rowId = await loggingRepo.logRequest({
        request: req,
        reply,
        latencyMs: latency
      });
      (req as any).isLogged = true;
      (req as any).requestLogId = rowId;
    }

    const shouldSample = this.configRepo.getSampleLoggingEnabled();
    if (shouldSample && Array.isArray((req as any).pendingAiLogs)) {
      const reqId = (req as any).requestLogId;
      if (reqId) {
        for (const item of (req as any).pendingAiLogs as any[]) {
          await loggingRepo.logAICall({
            reqId,
            provider: item.provider,
            model: item.model,
            promptName: item.promptName,
            promptVersion: item.promptVersion,
            responseJson: item.responseJson,
            latencyMs: item.latencyMs,
            usage: item.usage
          });
        }
      }
    }
  });

  return server;
}
