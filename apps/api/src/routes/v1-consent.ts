import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { consentRequestSchema } from '@decomind/shared-schemas';
import { buildOkResponse } from '@decomind/shared-utils';
import { db } from '../db';
import { insertRequestLog } from '../core/logging/repo';
import { handleUnknownError } from '../core/errors/handler';

export function registerConsent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/v1/consent', {
    schema: { body: consentRequestSchema },
  }, async (request, reply) => {
    try {
      const { body } = request;
      db.prepare(`INSERT INTO consents (consented, extra) VALUES (?, json(?))`).run(body.consented ? 1 : 0, JSON.stringify({}));
      const meta = { request_id: request.requestContext.requestId, latency_ms: Date.now() - request.requestContext.start };
      const response = buildOkResponse(meta, { acknowledged: true, consented: body.consented });
      if (!request.requestContext.logId) {
        const log = insertRequestLog({
          ip: request.ip,
          ua: request.headers['user-agent'] ?? '',
          endpoint: '/v1/consent',
          mode: 'consent',
          payload: body,
          forwarded: Boolean(request.headers['x-forwarded-for']),
          status: 'ok',
          latency: meta.latency_ms,
        });
        request.requestContext.logId = log.id;
      }
      return reply.status(200).send(response);
    } catch (err) {
      return handleUnknownError(reply, request, err);
    }
  });
}
