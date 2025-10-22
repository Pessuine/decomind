import { FastifyReply } from "fastify";
import { ERROR_MESSAGES, ErrorCode } from "./codes";
import { createErrorResponse } from "../../types/response";

export class ApiError extends Error {
  constructor(public readonly code: ErrorCode, message?: string) {
    super(message ?? ERROR_MESSAGES[code]);
  }
}

export function sendError(reply: FastifyReply, requestId: string, latencyMs: number, code: ErrorCode, overrideMessage?: string) {
  const message = overrideMessage ?? ERROR_MESSAGES[code];
  const response = createErrorResponse(requestId, latencyMs, {
    code,
    message
  });
  reply.status(code === "HOST_FORBIDDEN" ? 403 : 400).send(response);
}
