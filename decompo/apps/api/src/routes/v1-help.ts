import { FastifyInstance } from "fastify";
import { HelpRequestSchema, HelpResultSchema } from "@decompo/shared-schemas";
import { AppContext } from "../context";
import { HelpOrchestrator } from "../core/orchestrator/help";
import { ERROR_CODES } from "../core/errors/codes";
import { sendError } from "../core/errors/handler";

interface RouteRequest extends import("fastify").FastifyRequest {
  contextData?: {
    logId?: number;
    startTime: number;
  };
}

export function registerHelpRoute(server: FastifyInstance, ctx: AppContext, orchestrator: HelpOrchestrator) {
  server.post("/v1/help", async (request: RouteRequest, reply) => {
    const parsed = HelpRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "请求不合法",
        statusCode: 400,
      });
    }
    const body = parsed.data;
    const logId = request.contextData?.logId ?? ctx.loggingRepo.createRequestLog({
      ip: request.ip,
      ua: request.headers["user-agent"] as string,
      endpoint: request.routerPath || request.url,
      mode: body.mode,
      payload: body,
      forwarded: Boolean(request.headers["x-forwarded-for"]),
    });
    request.contextData = request.contextData || { startTime: Date.now() };
    request.contextData.logId = logId;

    const result = await orchestrator.generate(body.action, body.context);

    const payload = {
      version: 1,
      status: "ok" as const,
      meta: { request_id: result.meta.request_id, latency_ms: result.meta.latency_ms ?? 0 },
      data: result.response,
      error: null,
    };
    HelpResultSchema.parse(result.response);
    return reply.status(200).send(payload);
  });
}
