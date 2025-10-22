import { FastifyInstance } from "fastify";
import { SkipRequestSchema, ActionStepSchema } from "@decompo/shared-schemas";
import { AppContext } from "../context";
import { ActionOrchestrator } from "../core/orchestrator/action";
import { ERROR_CODES } from "../core/errors/codes";
import { sendError } from "../core/errors/handler";

interface RouteRequest extends import("fastify").FastifyRequest {
  contextData?: {
    logId?: number;
    startTime: number;
  };
}

export function registerSkipRoute(
  server: FastifyInstance,
  ctx: AppContext,
  actionOrchestrator: ActionOrchestrator
) {
  server.post("/v1/skip", async (request: RouteRequest, reply) => {
    const parsed = SkipRequestSchema.safeParse(request.body);
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

    const result = await actionOrchestrator.nextAction({
      task: { title: body.context.task, history: [body.context.current] },
      consentImprove: false,
      requestLogId: logId,
    });

    const payload = {
      version: 1,
      status: "ok" as const,
      meta: result.meta,
      data: result.response,
      error: null,
    };
    ActionStepSchema.parse(result.response);
    return reply.status(200).send(payload);
  });
}
