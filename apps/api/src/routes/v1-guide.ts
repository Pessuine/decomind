import { FastifyInstance } from 'fastify';
import { GuideRequestSchema } from '@decomind/shared-schemas';
import { createGuideOutline } from '../core/orchestrator/guide.js';
import { success } from '@decomind/shared-utils';
import { enforcePayloadLimits, checkRisk } from '../core/risk/filter.js';
import { replyError } from '../core/errors/handler.js';
import { writeAiCall } from '../core/logging/repo.js';
import { isExperienceSamplingEnabled } from '../core/risk/config.js';
import { loadModelConfig } from '../core/config/repo.js';

export default async function guideRoute(fastify: FastifyInstance) {
  fastify.post('/guide', async (request, reply) => {
    const parsed = GuideRequestSchema.parse(request.body);
    enforcePayloadLimits(parsed);
    const risk = checkRisk(parsed.topic);
    if (risk) {
      return replyError(reply, 'RISK_BLOCKED', `命中敏感词: ${risk}`);
    }
    const start = Date.now();
    const { payload, promptVersion, usage } = await createGuideOutline(parsed);
    const latency = Date.now() - start;
    const logId = Number((request as any).logMeta?.log?.id) || 0;
    const response = success({ outline: payload.outline }, { request_id: logId ? String(logId) : '', latency_ms: latency });
    if (logId && isExperienceSamplingEnabled()) {
      writeAiCall({
        reqId: logId,
        provider: 'qwen',
        model: loadModelConfig().model_name,
        promptName: 'guide_outline',
        promptVersion,
        latencyMs: latency,
        responseJson: response.data,
        tokens: { input: usage?.prompt_tokens, output: usage?.completion_tokens }
      });
    }
    return reply.send(response);
  });
}
