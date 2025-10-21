import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { guideRequestSchema } from '@decomind/shared-schemas';
import { buildOkResponse } from '@decomind/shared-utils';
import { runGuideStrategy } from '../core/orchestrator/guide';
import { insertAiCall, insertRequestLog } from '../core/logging/repo';
import { handleUnknownError } from '../core/errors/handler';
import { hasConsent } from '../core/logging/consent';

export function registerGuide(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/v1/guide', {
    schema: { body: guideRequestSchema },
  }, async (request, reply) => {
    try {
      const { body } = request;
      const result = await runGuideStrategy(body);
      const meta = { request_id: request.requestContext.requestId, latency_ms: result.latency };
      const response = buildOkResponse(meta, result.data);
      if (!request.requestContext.logId) {
        const log = insertRequestLog({
          ip: request.ip,
          ua: request.headers['user-agent'] ?? '',
          endpoint: '/v1/guide',
          mode: 'guide',
          payload: body,
          forwarded: Boolean(request.headers['x-forwarded-for']),
          status: 'ok',
          latency: result.latency,
          extra: { promptVersion: result.promptVersion },
        });
        request.requestContext.logId = log.id;
      }
      if (hasConsent() && request.requestContext.logId) {
        insertAiCall({
          reqId: request.requestContext.logId,
          provider: 'qwen',
          model: 'chat-completions',
          promptName: 'guide_outline',
          promptVersion: result.promptVersion,
          inputTokens: result.usage?.promptTokens,
          outputTokens: result.usage?.completionTokens,
          latency: result.latency,
          responseJson: response.data,
        });
      }
      return reply.status(200).send(response);
    } catch (err) {
      return handleUnknownError(reply, request, err);
    }
  });
}
