import { FastifyInstance } from "fastify";
import { ConsentRequestSchema } from "@decompo/shared-schemas";
import { AppContext } from "../context";
import { ERROR_CODES } from "../core/errors/codes";
import { sendError } from "../core/errors/handler";

interface RouteRequest extends import("fastify").FastifyRequest {
  contextData?: {
    logId?: number;
    startTime: number;
  };
}

export function registerConsentRoute(server: FastifyInstance, ctx: AppContext) {
  server.post("/v1/consent", async (request: RouteRequest, reply) => {
    const parsed = ConsentRequestSchema.safeParse(request.body);
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
      payload: body,
      forwarded: Boolean(request.headers["x-forwarded-for"]),
    });
    request.contextData = request.contextData || { startTime: Date.now() };
    request.contextData.logId = logId;

    ctx.db
      .prepare(`INSERT INTO consents (consented, extra) VALUES (@consented, '{}')`)
      .run({ consented: body.consented ? 1 : 0 });

    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: { success: true },
      error: null,
    });
  });
}
