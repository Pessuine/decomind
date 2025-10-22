import type { FastifyReply } from "fastify";
import { ErrorCode, ErrorMessages } from "./codes.js";

export interface ApiError extends Error {
  code: ErrorCode;
  statusCode?: number;
  details?: unknown;
}

export function toApiError(err: unknown): ApiError {
  if (err && typeof err === "object" && "code" in err && (err as any).code in ErrorCode) {
    return err as ApiError;
  }
  const apiError: ApiError = new Error("Internal error") as ApiError;
  apiError.code = ErrorCode.INTERNAL_ERROR;
  apiError.statusCode = 500;
  return apiError;
}

export function sendError(reply: FastifyReply, err: ApiError) {
  const statusCode = err.statusCode ?? 500;
  reply.status(statusCode).send({
    version: 1,
    status: "error",
    error: {
      code: err.code,
      message: ErrorMessages[err.code] ?? "加载失败，请重试",
    },
  });
}
