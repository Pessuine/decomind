import { FastifyInstance } from "fastify";
import { ExecuteRequestSchema, ActionStepSchema } from "@decompo/shared-schemas";
import { AppContext } from "../context";
import { ActionOrchestrator } from "../core/orchestrator/action";
import { ERROR_CODES } from "../core/errors/codes";
import { sendError } from "../core/errors/handler";

interface RouteRequest extends import("fastify").FastifyRequest {
  contextData?: {
    logId?: number;
    startTime: number;
    consentImprove?: boolean;
  };
}

export function registerExecuteRoute(server: FastifyInstance, ctx: AppContext, orchestrator: ActionOrchestrator) {
  server.post("/v1/execute", async (request: RouteRequest, reply) => {
    const parsed = ExecuteRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "请求不合法",
        statusCode: 400,
      });
    }
    const body = parsed.data;
    request.contextData = request.contextData || { startTime: Date.now() };
    request.contextData.consentImprove = body.consent_improve ?? false;

    const logId = request.contextData.logId ?? ctx.loggingRepo.createRequestLog({
      ip: request.ip,
      ua: request.headers["user-agent"] as string,
      endpoint: request.routerPath || request.url,
      mode: body.mode,
      payload: body,
      forwarded: Boolean(request.headers["x-forwarded-for"]),
    });
    request.contextData.logId = logId;

    const result = await orchestrator.nextAction({
      task: body.task,
      prefs: body.prefs,
      consentImprove: body.consent_improve,
      requestLogId: logId,
    });

    const responsePayload = {
      version: 1,
      status: "ok",
      meta: result.meta,
      data: result.response,
      error: null,
    };
    ActionStepSchema.parse(result.response);
    return reply.status(200).send(responsePayload);
  });
}
