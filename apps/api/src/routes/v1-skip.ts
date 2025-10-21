import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { skipRequestSchema, HelpRequest } from '@decomind/shared-schemas';
import { buildOkResponse } from '@decomind/shared-utils';
import { runHelpStrategy } from '../core/orchestrator/help';
import { ensureActionResponseCompliance } from '../core/postrules/validate';
import { insertAiCall, insertRequestLog } from '../core/logging/repo';
import { handleUnknownError } from '../core/errors/handler';
import { hasConsent } from '../core/logging/consent';

export function registerSkip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/v1/skip', {
    schema: { body: skipRequestSchema },
  }, async (request, reply) => {
    try {
      const { body } = request;
      const helpPayload: HelpRequest = {
        version: body.version,
        mode: body.mode,
        action: 'alt',
        context: body.context,
      };
      const result = await runHelpStrategy(helpPayload);
      ensureActionResponseCompliance(result.data);
      const meta = { request_id: request.requestContext.requestId, latency_ms: result.latency };
      const response = buildOkResponse(meta, { step: result.data.step });
      if (!request.requestContext.logId) {
        const log = insertRequestLog({
          ip: request.ip,
          ua: request.headers['user-agent'] ?? '',
          endpoint: '/v1/skip',
          mode: body.mode,
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
          promptName: 'help_alt',
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
