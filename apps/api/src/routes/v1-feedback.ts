import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { feedbackRequestSchema } from '@decomind/shared-schemas';
import { buildOkResponse } from '@decomind/shared-utils';
import { db } from '../db';
import { insertRequestLog } from '../core/logging/repo';
import { handleUnknownError } from '../core/errors/handler';

export function registerFeedback(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/v1/feedback', {
    schema: { body: feedbackRequestSchema },
  }, async (request, reply) => {
    try {
      const { body } = request;
      db.prepare(
        `INSERT INTO feedback (task_uuid, mode, rating, note, extra) VALUES (?, ?, ?, ?, json(?))`,
      ).run(body.task_uuid, body.mode, body.rating, body.note ?? '', JSON.stringify({}));
      const meta = { request_id: request.requestContext.requestId, latency_ms: Date.now() - request.requestContext.start };
      const response = buildOkResponse(meta, { acknowledged: true });
      if (!request.requestContext.logId) {
        const log = insertRequestLog({
          ip: request.ip,
          ua: request.headers['user-agent'] ?? '',
          endpoint: '/v1/feedback',
          mode: body.mode,
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
