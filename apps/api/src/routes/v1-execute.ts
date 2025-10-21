import { FastifyInstance } from 'fastify';
import { ExecuteRequestSchema } from '@decomind/shared-schemas';
import { createActionStep } from '../core/orchestrator/action.js';
import { success } from '@decomind/shared-utils';
import { replyError } from '../core/errors/handler.js';
import { enforcePayloadLimits, checkRisk } from '../core/risk/filter.js';
import { isExperienceSamplingEnabled } from '../core/risk/config.js';
import { writeAiCall } from '../core/logging/repo.js';
import { loadModelConfig } from '../core/config/repo.js';

export default async function executeRoute(fastify: FastifyInstance) {
  fastify.post('/execute', async (request, reply) => {
    const parsed = ExecuteRequestSchema.parse(request.body);
    enforcePayloadLimits(parsed);
    const risk = checkRisk(parsed.task.title + parsed.task.history.join(''));
    if (risk) {
      return replyError(reply, 'RISK_BLOCKED', `命中敏感词: ${risk}`);
    }
    const start = Date.now();
    const { payload, promptVersion, usage } = await createActionStep(parsed);
    const latency = Date.now() - start;
    const logId = Number((request as any).logMeta?.log?.id) || 0;
    const meta = { request_id: logId ? String(logId) : '', latency_ms: latency };
    const response = success({
      step: payload.step,
      progress: payload.progress,
      menu: payload.menu
    }, meta);
    if (logId && parsed.consent_improve && isExperienceSamplingEnabled()) {
      writeAiCall({
        reqId: logId,
        provider: 'qwen',
        model: loadModelConfig().model_name,
        promptName: 'action_step',
        promptVersion,
        latencyMs: latency,
        responseJson: response.data,
        tokens: { input: usage?.prompt_tokens, output: usage?.completion_tokens }
      });
    }
    return reply.send(response);
  });
}
