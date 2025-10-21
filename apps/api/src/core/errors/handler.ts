import { FastifyReply, FastifyRequest } from 'fastify';
import { buildErrorResponse, createRequestId } from '@decomind/shared-utils';
import { ERROR_MESSAGES, ErrorCode } from './codes';

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;

  constructor(code: ErrorCode, message?: string, status = 400) {
    super(message ?? ERROR_MESSAGES[code]);
    this.code = code;
    this.status = status;
  }
}

function getLatency(request: FastifyRequest): number {
  const start = request.requestContext?.start ?? Date.now();
  return Date.now() - start;
}

export function sendError(reply: FastifyReply, request: FastifyRequest, code: ErrorCode, status: number, message?: string) {
  const requestId = request.requestContext?.requestId ?? createRequestId();
  reply.header('x-request-id', requestId);
  const payload = buildErrorResponse(
    { request_id: requestId, latency_ms: getLatency(request) },
    code,
    message ?? ERROR_MESSAGES[code] ?? '错误',
  );
  return reply.status(status).send(payload);
}

export function handleUnknownError(reply: FastifyReply, request: FastifyRequest, err: unknown) {
  if (err instanceof ApiError) {
    return sendError(reply, request, err.code, err.status, err.message);
  }
  requestErrorLog(err);
  return sendError(reply, request, 'INTERNAL_ERROR', 500);
}

function requestErrorLog(err: unknown) {
  if (err instanceof Error) {
    console.error('[api] Unexpected error:', err.stack);
  } else {
    console.error('[api] Unexpected error:', err);
  }
}
