import { FastifyInstance } from "fastify";
import { GuideRequestSchema, GuideOutlineSchema } from "@decompo/shared-schemas";
import { AppContext } from "../context";
import { GuideOrchestrator } from "../core/orchestrator/guide";
import { ERROR_CODES } from "../core/errors/codes";
import { sendError } from "../core/errors/handler";

interface RouteRequest extends import("fastify").FastifyRequest {
  contextData?: {
    logId?: number;
    startTime: number;
  };
}

export function registerGuideRoute(server: FastifyInstance, ctx: AppContext, orchestrator: GuideOrchestrator) {
  server.post("/v1/guide", async (request: RouteRequest, reply) => {
    const parsed = GuideRequestSchema.safeParse(request.body);
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
      mode: "guide",
      payload: body,
      forwarded: Boolean(request.headers["x-forwarded-for"]),
    });
    request.contextData = request.contextData || { startTime: Date.now() };
    request.contextData.logId = logId;

    const result = await orchestrator.outline(body.topic, body.depth);
    const payload = {
      version: 1,
      status: "ok" as const,
      meta: { request_id: result.meta.request_id, latency_ms: result.meta.latency_ms ?? 0 },
      data: result.response,
      error: null,
    };
    GuideOutlineSchema.parse(result.response);
    return reply.status(200).send(payload);
  });
}
