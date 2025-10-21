import { FastifyRequest, FastifyReply } from 'fastify';
import { loadSysConfig } from '../core/config/repo.js';
import { replyError } from '../core/errors/handler.js';

export async function hostGuard(request: FastifyRequest, reply: FastifyReply) {
  const cfg = loadSysConfig();
  const host = request.headers.host?.toLowerCase() || '';
  const allowed = new Set([cfg.api_domain?.toLowerCase(), 'localhost', `localhost:${process.env.PORT || 8080}`]);
  if (!allowed.has(host)) {
    await replyError(reply, 'HOST_FORBIDDEN');
    return reply;
  }
}
