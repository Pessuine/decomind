import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import requestLogger from './middlewares/request-logger.js';
import { hostGuard } from './middlewares/host-guard.js';
import { replyError } from './core/errors/handler.js';
import executeRoute from './routes/v1-execute.js';
import helpRoute from './routes/v1-help.js';
import skipRoute from './routes/v1-skip.js';
import guideRoute from './routes/v1-guide.js';
import feedbackRoute from './routes/v1-feedback.js';
import consentRoute from './routes/v1-consent.js';
import healthRoute from './routes/healthz.js';
import adminRoutes from './routes/admin-auth.js';
import { ZodError } from 'zod';

export async function createServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' }
    }
  });

  await server.register(helmet);
  await server.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute'
  });
  await server.register(requestLogger);

  server.addHook('onRequest', hostGuard);

  server.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (error.validation || error instanceof ZodError) {
      return replyError(reply, 'VALIDATION_ERROR', error.message);
    }
    switch (error.message) {
      case 'PAYLOAD_TOO_LARGE':
        return replyError(reply, 'PAYLOAD_TOO_LARGE');
      case 'PROMPT_NOT_FOUND':
        return replyError(reply, 'INTERNAL_ERROR', 'Prompt 未配置');
      case 'INVALID_ACTION_SENTENCE':
        return replyError(reply, 'MODEL_FORMAT_ERROR', '输出不符合约束');
      default:
        if (error instanceof SyntaxError || (typeof error.message === 'string' && error.message.includes('JSON'))) {
          return replyError(reply, 'MODEL_FORMAT_ERROR');
        }
        return replyError(reply, 'INTERNAL_ERROR');
    }
  });

  server.register(executeRoute, { prefix: '/v1' });
  server.register(helpRoute, { prefix: '/v1' });
  server.register(skipRoute, { prefix: '/v1' });
  server.register(guideRoute, { prefix: '/v1' });
  server.register(feedbackRoute, { prefix: '/v1' });
  server.register(consentRoute, { prefix: '/v1' });
  server.register(healthRoute);
  server.register(adminRoutes);

  return server;
}
