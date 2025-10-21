import { FastifyInstance } from 'fastify';
import { ConsentRequestSchema } from '@decomind/shared-schemas';
import { db } from '../core/config/database.js';
import { success } from '@decomind/shared-utils';

export default async function consentRoute(fastify: FastifyInstance) {
  fastify.post('/consent', async (request, reply) => {
    const parsed = ConsentRequestSchema.parse(request.body);
    db.prepare('INSERT INTO consents (consented, extra) VALUES (?, json(?))').run(
      parsed.consented ? 1 : 0,
      JSON.stringify({})
    );
    const logId = Number((request as any).logMeta?.log?.id) || 0;
    return reply.send(success({}, { request_id: logId ? String(logId) : '', latency_ms: 0 }));
  });
}
