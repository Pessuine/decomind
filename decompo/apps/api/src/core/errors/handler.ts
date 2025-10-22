import { FastifyReply, FastifyRequest } from "fastify";
import { ERROR_CODES } from "./codes";

interface ErrorResponseOptions {
  code: keyof typeof ERROR_CODES;
  message: string;
  statusCode?: number;
}

export function sendError(reply: FastifyReply, opts: ErrorResponseOptions) {
  const status = opts.statusCode ?? 400;
  return reply.status(status).send({
    version: 1,
    status: "error",
    meta: undefined,
    data: null,
    error: {
      code: opts.code,
      message: opts.message,
    },
  });
}

export function registerErrorHandler(server: import("fastify").FastifyInstance) {
  server.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request errored");
    const status = (error as any).statusCode ?? 500;
    const code = (error as any).code ?? ERROR_CODES.INTERNAL_ERROR;
    const message = error.message || "加载失败，请重试";
    reply.status(status).send({
      version: 1,
      status: "error",
      data: null,
      error: { code, message },
    });
  });
}
