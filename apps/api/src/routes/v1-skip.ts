import { FastifyInstance } from 'fastify';
import { SkipRequestSchema } from '@decomind/shared-schemas';
import { createHelpStep } from '../core/orchestrator/help.js';
import { success } from '@decomind/shared-utils';
import { replyError } from '../core/errors/handler.js';
import { enforcePayloadLimits, checkRisk } from '../core/risk/filter.js';

export default async function skipRoute(fastify: FastifyInstance) {
  fastify.post('/skip', async (request, reply) => {
    const parsed = SkipRequestSchema.parse(request.body);
    enforcePayloadLimits(parsed);
    const risk = checkRisk(parsed.context.current);
    if (risk) {
      return replyError(reply, 'RISK_BLOCKED', `命中敏感词: ${risk}`);
    }
    const start = Date.now();
    const { payload } = await createHelpStep({
      version: parsed.version,
      mode: parsed.mode,
      action: 'alt',
      context: parsed.context
    } as any);
    const latency = Date.now() - start;
    const logId = Number((request as any).logMeta?.log?.id) || 0;
    const response = success({ step: payload.step }, { request_id: logId ? String(logId) : '', latency_ms: latency });
    return reply.send(response);
  });
}
