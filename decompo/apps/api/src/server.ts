import Fastify, { FastifyRequest } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import pino from "pino";
import { AppContext } from "./context";
import { registerErrorHandler, sendError } from "./core/errors/handler";
import { ERROR_CODES } from "./core/errors/codes";
import { registerExecuteRoute } from "./routes/v1-execute";
import { registerHelpRoute } from "./routes/v1-help";
import { registerSkipRoute } from "./routes/v1-skip";
import { registerGuideRoute } from "./routes/v1-guide";
import { registerFeedbackRoute } from "./routes/v1-feedback";
import { registerConsentRoute } from "./routes/v1-consent";
import { registerHealthzRoute } from "./routes/healthz";
import { ActionOrchestrator } from "./core/orchestrator/action";
import { HelpOrchestrator } from "./core/orchestrator/help";
import { GuideOrchestrator } from "./core/orchestrator/guide";
import { registerAdminRoutes } from "./routes/admin";

interface EnvConfig {
  port: number;
  allowLocalhost: boolean;
}

interface DecoratedRequest extends FastifyRequest {
  contextData?: {
    logId?: number;
    startTime: number;
    consentImprove?: boolean;
  };
}

export function buildServer(ctx: AppContext, env: EnvConfig) {
  const logger = pino({ level: process.env.LOG_LEVEL || "info" });
  const riskCfg = ctx.configRepo.getRiskConfig();

  const server = Fastify({
    logger,
    bodyLimit: riskCfg.maxBodySize,
  });

  server.register(helmet, { contentSecurityPolicy: false });
  server.register(cookie);
  server.register(rateLimit, {
    max: riskCfg.rateLimit.points,
    timeWindow: riskCfg.rateLimit.duration * 1000,
  });

  const actionOrchestrator = new ActionOrchestrator(ctx.configRepo, ctx.promptRepo, ctx.loggingRepo);
  const helpOrchestrator = new HelpOrchestrator(ctx.configRepo, ctx.promptRepo);
  const guideOrchestrator = new GuideOrchestrator(ctx.configRepo, ctx.promptRepo);

  server.decorate("appContext", ctx);
  server.addHook("onRequest", async (request: DecoratedRequest, reply) => {
    const hostHeader = request.headers.host?.split(":")[0];
    const sysConfig = ctx.configRepo.getSystemConfig();
    const allowedHosts = new Set([sysConfig?.apiDomain, sysConfig?.appDomain, sysConfig?.adminDomain].filter(Boolean) as string[]);
    const isLocal = env.allowLocalhost && hostHeader && ["localhost", "127.0.0.1", "::1"].includes(hostHeader);
    request.contextData = { startTime: Date.now() };
    if (!hostHeader || (!allowedHosts.has(hostHeader) && !isLocal)) {
      const logId = ctx.loggingRepo.createRequestLog({
        ip: request.ip,
        ua: request.headers["user-agent"] as string,
        endpoint: request.url,
        payload: null,
        forwarded: Boolean(request.headers["x-forwarded-for"]),
        status: "403",
        latencyMs: 0,
      });
      ctx.loggingRepo.finalizeRequestLog(logId, {
        status: "403",
        latencyMs: 0,
      });
      sendError(reply, {
        code: ERROR_CODES.HOST_FORBIDDEN,
        message: "非法访问",
        statusCode: 403,
      });
      return reply;
    }
  });

  server.addHook("preHandler", async (request: DecoratedRequest, reply) => {
    if (!request.contextData?.logId) {
      let payloadForLog: any = request.body;
      if (request.routerPath === "/v1/admin/login" && payloadForLog) {
        payloadForLog = { masked: true };
      }
      const logId = ctx.loggingRepo.createRequestLog({
        ip: request.ip,
        ua: request.headers["user-agent"] as string,
        endpoint: request.routerPath || request.url,
        mode: (request.body as any)?.mode,
        payload: payloadForLog,
        forwarded: Boolean(request.headers["x-forwarded-for"]),
      });
      request.contextData = request.contextData || { startTime: Date.now() };
      request.contextData.logId = logId;
    }

    const payloadText = JSON.stringify(request.body ?? {});
    const risk = ctx.riskFilter.checkPayload(payloadText);
    if (risk.blocked) {
      ctx.loggingRepo.finalizeRequestLog(request.contextData!.logId!, {
        status: "403",
        latencyMs: Date.now() - (request.contextData?.startTime ?? Date.now()),
      });
      sendError(reply, {
        code: ERROR_CODES.RISK_BLOCKED,
        message: "加载失败，请重试",
        statusCode: 403,
      });
      return reply;
    }
  });

  server.addHook("onResponse", (request: DecoratedRequest, reply, done) => {
    if (request.contextData?.logId) {
      ctx.loggingRepo.finalizeRequestLog(request.contextData.logId, {
        status: reply.statusCode.toString(),
        latencyMs: Date.now() - (request.contextData.startTime ?? Date.now()),
      });
    }
    done();
  });

  registerErrorHandler(server);

  registerExecuteRoute(server, ctx, actionOrchestrator);
  registerHelpRoute(server, ctx, helpOrchestrator);
  registerSkipRoute(server, ctx, actionOrchestrator);
  registerGuideRoute(server, ctx, guideOrchestrator);
  registerFeedbackRoute(server, ctx);
  registerConsentRoute(server, ctx);
  registerHealthzRoute(server);
  registerAdminRoutes(server, ctx);

  return server;
}
