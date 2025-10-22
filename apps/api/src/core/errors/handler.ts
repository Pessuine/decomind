import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ErrorMessages } from "./codes";
import type { LoggingRepo } from "../logging/repo";

export function buildErrorHandler(loggingRepo: LoggingRepo) {
  return async function errorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const code = error.message && ErrorMessages[error.message] ? error.message : "INTERNAL_ERROR";
    const message = ErrorMessages[code] ?? "服务器内部错误";
    request.log.error({ err: error }, "Request failed");
    reply.code(reply.statusCode >= 400 ? reply.statusCode : 400);
    if (!(request as any).isLogged) {
      const rowId = await loggingRepo.logRequest({
        request,
        reply,
        latencyMs: Date.now() - ((request as any).startedAt ?? Date.now())
      });
      (request as any).isLogged = true;
      (request as any).requestLogId = rowId;
    }
    reply.send({
      version: 1,
      status: "error",
      error: {
        code,
        message
      }
    });
  };
}
