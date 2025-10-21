import fp from 'fastify-plugin';
import { createRequestLog, finalizeRequestLog } from '../core/logging/repo.js';

export default fp(async (fastify) => {
  fastify.addHook('onRequest', async (request) => {
    const start = Date.now();
    const log = createRequestLog({
      ip: request.ip,
      ua: request.headers['user-agent'],
      endpoint: request.routerPath || request.url,
      mode: (request.body as any)?.mode ?? null,
      payload: request.body,
      forwarded: Boolean(request.headers['x-forwarded-for'])
    });
    (request as any).logMeta = { start, log };
  });

  fastify.addHook('onSend', async (request, reply, payload) => {
    const meta = (request as any).logMeta;
    if (!meta) return;
    const latency = Date.now() - meta.start;
    const status = reply.statusCode >= 200 && reply.statusCode < 400 ? 'ok' : 'error';
    finalizeRequestLog(meta.log, status, latency, {
      statusCode: reply.statusCode
    });
  });

  fastify.addHook('onError', async (request, reply, error) => {
    const meta = (request as any).logMeta;
    if (!meta) return;
    const latency = Date.now() - meta.start;
    finalizeRequestLog(meta.log, 'error', latency, { error: error.message });
  });
});
