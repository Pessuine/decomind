import { FastifyReply } from 'fastify';
import { ERROR_MESSAGES } from './codes.js';
import { failure } from '@decomind/shared-utils';

export function replyError(reply: FastifyReply, code: string, message?: string) {
  const msg = message || ERROR_MESSAGES[code] || '服务器内部错误';
  return reply.status(code === 'HOST_FORBIDDEN' ? 403 : 400).send(failure(code, msg));
}
