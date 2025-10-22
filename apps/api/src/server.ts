import "dotenv/config";
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { initDatabase } from "./core/config/database";
import { loadInitSql, loadSystemConfig } from "./core/config/repo";
import { createRequestLogger } from "./core/logging/repo";
import { createAiLogger } from "./core/logging/ai";
import { runRiskChecks } from "./core/risk/filter";
import { sendError } from "./core/errors/handler";
import { ERROR_MESSAGES } from "./core/errors/codes";
import { createSuccessResponse } from "./types/response";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { getRequestId } from "./types/context";

const LATENCY_SYMBOL = Symbol("latency");

function setLatencyStart(request: FastifyRequest) {
  (request as any)[LATENCY_SYMBOL] = Date.now();
}

function getLatencyMs(request: FastifyRequest): number {
  const started: number | undefined = (request as any)[LATENCY_SYMBOL];
  return started ? Date.now() - started : 0;
}

function allowedHosts(server: FastifyInstance): Set<string> {
  const config = loadSystemConfig(server.db);
  const values = [config.api_domain, config.admin_domain, config.app_domain, "localhost", "127.0.0.1"];
  return new Set(values.filter(Boolean));
}

export async function createServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" }
    }
  });

  const db = initDatabase();
  try {
    db.exec(loadInitSql());
  } catch (error) {
    server.log.error({ err: error }, "Failed to initialize database schema");
    throw error;
  }

  server.decorate("db", db);
  server.decorate("logRequest", createRequestLogger(db, server.log));
  server.decorate("logAiCall", createAiLogger(db));

  await server.register(helmet, { contentSecurityPolicy: false });
  await server.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX || 60),
    timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute"
  });

  server.addHook("onRequest", async (request, reply) => {
    setLatencyStart(request);

    const hosts = allowedHosts(server);
    const hostHeader = (request.headers.host || "").split(":")[0];
    if (!hosts.has(hostHeader) && !process.env.ALLOW_LOCALHOST) {
      const latency = getLatencyMs(request);
      sendError(reply, getRequestId(request), latency, "HOST_FORBIDDEN");
      server.logRequest(request, {
        endpoint: request.routerPath ?? request.url,
        mode: (request.body as any)?.mode ?? null,
        forwarded: false,
        status: "host_forbidden",
        latencyMs: latency,
        extra: { host: hostHeader }
      });
      return reply.hijack();
    }
  });

  server.addHook("preHandler", async (request, reply) => {
    if (request.method !== "GET") {
      const risk = runRiskChecks(server.db, request);
      if (risk.blocked) {
        const latency = getLatencyMs(request);
        sendError(reply, getRequestId(request), latency, "RISK_BLOCKED");
        server.logRequest(request, {
          endpoint: request.routerPath ?? request.url,
          mode: (request.body as any)?.mode ?? null,
          forwarded: false,
          status: "risk_blocked",
          latencyMs: latency,
          extra: { reason: risk.reason }
        });
        return reply.hijack();
      }
    }
  });

  server.addHook("onResponse", async (request, reply) => {
    const latency = getLatencyMs(request);
    server.logRequest(request, {
      endpoint: request.routerPath ?? request.url,
      mode: (request.body as any)?.mode ?? null,
      forwarded: false,
      status: String(reply.statusCode),
      latencyMs: latency
    });
  });

  server.get("/healthz", async (request) => {
    const latency = getLatencyMs(request);
    return createSuccessResponse(getRequestId(request), latency, { status: "ok" });
  });

  await server.register((await import("./routes/v1-execute")).default);
  await server.register((await import("./routes/v1-help")).default);
  await server.register((await import("./routes/v1-skip")).default);
  await server.register((await import("./routes/v1-guide")).default);
  await server.register((await import("./routes/v1-feedback")).default);
  await server.register((await import("./routes/v1-consent")).default);

  server.setErrorHandler((error, request, reply) => {
    server.log.error({ err: error }, "Unhandled error");
    const latency = getLatencyMs(request);
    sendError(reply, getRequestId(request), latency, "INTERNAL_ERROR", error.message ?? ERROR_MESSAGES.INTERNAL_ERROR);
  });

  return server;
}
