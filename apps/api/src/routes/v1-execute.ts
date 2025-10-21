import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { actionRequestSchema } from '@decomind/shared-schemas';
import { buildOkResponse } from '@decomind/shared-utils';
import { runActionStrategy } from '../core/orchestrator/action';
import { ensureActionResponseCompliance } from '../core/postrules/validate';
import { insertAiCall, insertRequestLog } from '../core/logging/repo';
import { handleUnknownError } from '../core/errors/handler';
import { hasConsent } from '../core/logging/consent';

export function registerExecute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/v1/execute', {
    schema: {
      body: actionRequestSchema,
    },
  }, async (request, reply) => {
    try {
      const { body } = request;
      const result = await runActionStrategy(body);
      ensureActionResponseCompliance(result.data);
      const meta = { request_id: request.requestContext.requestId, latency_ms: result.latency };
      const response = buildOkResponse(meta, result.data);
      if (!request.requestContext.logId) {
        const log = insertRequestLog({
          ip: request.ip,
          ua: request.headers['user-agent'] ?? '',
          endpoint: '/v1/execute',
          mode: body.mode,
          payload: body,
          forwarded: Boolean(request.headers['x-forwarded-for']),
          status: 'ok',
          latency: result.latency,
          extra: { promptVersion: result.promptVersion },
        });
        request.requestContext.logId = log.id;
      }
      if (body.consent_improve && hasConsent() && request.requestContext.logId) {
        insertAiCall({
          reqId: request.requestContext.logId,
          provider: 'qwen',
          model: 'chat-completions',
          promptName: 'action_step',
          promptVersion: result.promptVersion,
          inputTokens: result.usage?.promptTokens,
          outputTokens: result.usage?.completionTokens,
          latency: result.latency,
          responseJson: result.data,
        });
      }
      return reply.status(200).send(response);
    } catch (err) {
      return handleUnknownError(reply, request, err);
    }
  });
}
