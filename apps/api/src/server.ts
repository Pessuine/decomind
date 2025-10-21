import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ENV } from './env';
import { createRequestId } from '@decomind/shared-utils';
import { handleUnknownError, ApiError } from './core/errors/handler';
import { insertRequestLog } from './core/logging/repo';
import { checkRisk } from './core/risk/filter';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { buildRoutes } from './routes';

const allowedHosts = new Set<string>([ENV.API_DOMAIN]);
if (ENV.ALLOW_LOCALHOST) {
  allowedHosts.add('localhost');
  allowedHosts.add(`localhost:${ENV.PORT}`);
  allowedHosts.add('127.0.0.1');
  allowedHosts.add(`127.0.0.1:${ENV.PORT}`);
}

function ensureHost(request: FastifyRequest) {
  const hostHeader = request.headers.host ?? '';
  const host = hostHeader.split(':')[0];
  if (!allowedHosts.has(host)) {
    throw new ApiError('HOST_FORBIDDEN', 'Host not allowed', 403);
  }
}

export async function createServer() {
  const app = Fastify({
    logger: true,
    disableRequestLogging: true,
    trustProxy: true,
  });

  await app.register(helmet, { global: true });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    hook: 'preHandler',
    keyGenerator: (req) => req.ip,
  });

  app.addHook('onRequest', (request, reply, done) => {
    try {
      ensureHost(request);
      const requestId = createRequestId();
      request.requestContext = { start: Date.now(), requestId };
      reply.header('x-request-id', requestId);
      if (request.body) {
        const risk = checkRisk(request.body);
        if (risk) {
          throw new ApiError('RISK_BLOCKED', risk, 403);
        }
      }
      done();
    } catch (err) {
      done(err as Error);
    }
  });

  app.setErrorHandler((error, request, reply) => {
    if (!(error instanceof ApiError)) {
      app.log.error({ err: error }, 'Unhandled error');
    }
    if (!request.requestContext) {
      request.requestContext = { start: Date.now(), requestId: createRequestId() };
    }
    const response = handleUnknownError(reply, request, error);
    logRequestIfNeeded(app, request, reply, error instanceof ApiError ? error.code : 'INTERNAL_ERROR');
    return response;
  });

  app.addHook('onResponse', (request, reply, done) => {
    logRequestIfNeeded(app, request, reply, reply.statusCode >= 400 ? 'error' : 'ok');
    done();
  });

  buildRoutes(app);

  return app;
}

type LogStatus = 'ok' | 'error' | string;

function logRequestIfNeeded(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply, status: LogStatus) {
  if (request.requestContext.logId) {
    return;
  }
  try {
    const latency = Date.now() - (request.requestContext?.start ?? Date.now());
    const resStatus = typeof status === 'string' ? status : reply.statusCode >= 400 ? 'error' : 'ok';
    const log = insertRequestLog({
      ip: request.ip,
      ua: request.headers['user-agent'] ?? '',
      endpoint: request.routerPath ?? request.url,
      mode: typeof request.body === 'object' && request.body && 'mode' in request.body ? (request.body as any).mode : undefined,
      payload: request.body,
      forwarded: Boolean(request.headers['x-forwarded-for']),
      status: resStatus,
      latency,
      extra: { statusCode: reply.statusCode },
    });
    request.requestContext.logId = log.id;
  } catch (err) {
    app.log.error({ err }, 'Failed to persist request log');
  }
}
