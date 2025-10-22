import Fastify, { type FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import { RateLimiterMemory } from "rate-limiter-flexible";
import type Database from "better-sqlite3";
import { openDatabase, ensureSchema } from "./core/db.js";
import { insertRequestLog } from "./core/logging/repo.js";
import { loadSystemConfig } from "./core/config/repo.js";
import { loadRiskConfig } from "./core/risk/config.js";
import { runRiskChecks } from "./core/risk/filter.js";
import { ErrorCode } from "./core/errors/codes.js";
import { toApiError, sendError } from "./core/errors/handler.js";
import { registerHealthzRoute } from "./routes/healthz.js";
import { registerExecuteRoute } from "./routes/v1-execute.js";
import { registerHelpRoute } from "./routes/v1-help.js";
import { registerSkipRoute } from "./routes/v1-skip.js";
import { registerGuideRoute } from "./routes/v1-guide.js";
import { registerFeedbackRoute } from "./routes/v1-feedback.js";
import { registerConsentRoute } from "./routes/v1-consent.js";

export interface AppContext {
  db: Database.Database;
  riskKeywords: string[];
  maxBodyLength: number;
  allowedHosts: Set<string>;
  consentSampleEnabled: boolean;
}

declare module "fastify" {
  interface FastifyInstance {
    ctx: AppContext;
  }
}

export async function createServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
  });

  const db = openDatabase();
  ensureSchema(db);
  const systemConfig = loadSystemConfig(db);
  const riskConfig = loadRiskConfig();
  const dbKeywords = systemConfig.risk_keywords
    ? systemConfig.risk_keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];
  const keywordSet = new Set<string>([...riskConfig.keywords, ...dbKeywords]);
  const apiPort = Number(process.env.PORT || 8080);
  const allowedHosts = new Set([
    systemConfig.api_domain.toLowerCase(),
    `${systemConfig.api_domain.toLowerCase()}:${apiPort}`,
  ]);
  if (process.env.ALLOW_LOCALHOST === "true") {
    allowedHosts.add("localhost");
    allowedHosts.add(`localhost:${apiPort}`);
  }

  const rateLimiter = new RateLimiterMemory({ points: 120, duration: 60 });

  app.decorate("ctx", {
    db,
    riskKeywords: Array.from(keywordSet),
    maxBodyLength: riskConfig.maxBodyLength,
    allowedHosts,
    consentSampleEnabled: process.env.CONSENT_SAMPLE_ENABLED === "true",
  });

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
  });

  app.addHook("onRequest", async (request, reply) => {
    const host = (request.headers["host"] || "").toLowerCase();
    if (host && !app.ctx.allowedHosts.has(host)) {
      const err: any = new Error("Forbidden host");
      err.code = ErrorCode.HOST_FORBIDDEN;
      err.statusCode = 403;
      throw err;
    }
    try {
      await rateLimiter.consume(request.ip);
    } catch {
      const err: any = new Error("Too many requests");
      err.code = ErrorCode.RISK_BLOCKED;
      err.statusCode = 429;
      throw err;
    }
  });

  app.setErrorHandler((error, request, reply) => {
    const apiError = toApiError(error);
    if (!(error as any).code && error.validation) {
      apiError.code = ErrorCode.VALIDATION_ERROR;
      apiError.statusCode = 400;
      apiError.message = "Validation error";
    }
    sendError(reply, apiError);
  });

  app.addHook("preHandler", async (request, reply) => {
    if (request.method === "POST") {
      const bodyText = JSON.stringify(request.body ?? "");
      runRiskChecks({
        textFields: [bodyText],
        configKeywords: app.ctx.riskKeywords,
        maxBodyLength: app.ctx.maxBodyLength,
      });
    }
  });

  app.addHook("onResponse", async (request, reply) => {
    const latency = Math.max(0, reply.getResponseTime());
    try {
      const res = insertRequestLog(app.ctx.db, {
        ip: request.ip,
        ua: request.headers["user-agent"],
        endpoint: request.routerPath || request.url,
        mode: (request.body as any)?.mode || null,
        payload: request.body,
        forwarded: true,
        status: String(reply.statusCode),
        latencyMs: Math.round(latency),
        extra: {
          consent_sampled: app.ctx.consentSampleEnabled,
        },
      });
      reply.header("x-request-log-id", res.lastInsertRowid);
    } catch (err) {
      request.log.error({ err }, "Failed to insert request log");
    }
  });

  await registerHealthzRoute(app);
  await registerExecuteRoute(app);
  await registerHelpRoute(app);
  await registerSkipRoute(app);
  await registerGuideRoute(app);
  await registerFeedbackRoute(app);
  await registerConsentRoute(app);

  return app;
}
