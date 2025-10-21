import { FastifyInstance } from 'fastify';
import { FeedbackRequestSchema } from '@decomind/shared-schemas';
import { db } from '../core/config/database.js';
import { success } from '@decomind/shared-utils';

export default async function feedbackRoute(fastify: FastifyInstance) {
  fastify.post('/feedback', async (request, reply) => {
    const parsed = FeedbackRequestSchema.parse(request.body);
    db.prepare(
      'INSERT INTO feedback (task_uuid, mode, rating, note, extra) VALUES (?, ?, ?, ?, json(?))'
    ).run(parsed.task_uuid, parsed.mode, parsed.rating, parsed.note ?? '', JSON.stringify({}));
    const logId = Number((request as any).logMeta?.log?.id) || 0;
    return reply.send(success({}, { request_id: logId ? String(logId) : '', latency_ms: 0 }));
  });
}
