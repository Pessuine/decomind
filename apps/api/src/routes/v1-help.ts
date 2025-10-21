import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { helpRequestSchema } from '@decomind/shared-schemas';
import { buildOkResponse } from '@decomind/shared-utils';
import { runHelpStrategy } from '../core/orchestrator/help';
import { ensureActionResponseCompliance } from '../core/postrules/validate';
import { insertAiCall, insertRequestLog } from '../core/logging/repo';
import { handleUnknownError } from '../core/errors/handler';
import { hasConsent } from '../core/logging/consent';

export function registerHelp(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/v1/help', {
    schema: { body: helpRequestSchema },
  }, async (request, reply) => {
    try {
      const { body } = request;
      const result = await runHelpStrategy(body);
      ensureActionResponseCompliance(result.data);
      const meta = { request_id: request.requestContext.requestId, latency_ms: result.latency };
      const response = buildOkResponse(meta, { step: result.data.step });
      if (!request.requestContext.logId) {
        const log = insertRequestLog({
          ip: request.ip,
          ua: request.headers['user-agent'] ?? '',
          endpoint: '/v1/help',
          mode: body.mode,
          payload: body,
          forwarded: Boolean(request.headers['x-forwarded-for']),
          status: 'ok',
          latency: result.latency,
          extra: { promptVersion: result.promptVersion, action: body.action },
        });
        request.requestContext.logId = log.id;
      }
      if (hasConsent() && request.requestContext.logId) {
        insertAiCall({
          reqId: request.requestContext.logId,
          provider: 'qwen',
          model: 'chat-completions',
          promptName: 'help_' + body.action,
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
