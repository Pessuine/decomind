import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { v4 as uuid } from 'uuid';
import { ConfigRepository } from './core/config/repo';
import { createRiskConfig } from './core/risk/config';
import { ensureSafePayload } from './core/risk/filter';
import { hashIp, summarizePayload } from './core/logging/redact';
import { logAiCall, logRequest } from './core/logging/repo';
import { runAction } from './core/orchestrator/action';
import { runHelp } from './core/orchestrator/help';
import { runGuide } from './core/orchestrator/guide';
import { sendError } from './core/errors/handler';
import { ERROR_CODES, ApiError } from './core/errors/codes';
import { db } from './core/database';

const SUCCESS_TEMPLATE = {
  version: 1 as const,
  status: 'ok' as const,
  error: null
};

type SuccessMeta = {
  request_id: string;
  latency_ms: number;
};

export function createServer(configRepo: ConfigRepository) {
  const fastify = Fastify({
    logger: process.env.NODE_ENV === 'production' ? true : { transport: { target: 'pino-pretty' } }
  });

  fastify.register(helmet);
  fastify.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX ?? 60),
    timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute'
  });

  fastify.addHook('onRequest', (request, _reply, done) => {
    (request.raw as any)._startTime = Date.now();
    const cfg = configRepo.getConfig();
    const host = request.headers.host ?? '';
    const hostname = host.split(':')[0];
    const allowedHosts = new Set([cfg.apiDomain, cfg.adminDomain, cfg.appDomain]);
    if (cfg.allowLocalhost) {
      allowedHosts.add('localhost');
      allowedHosts.add('127.0.0.1');
    }
    if (!allowedHosts.has(hostname)) {
      done(new ApiError(ERROR_CODES.HOST_FORBIDDEN, 'HOST_FORBIDDEN'));
      return;
    }
    done();
  });

  fastify.setErrorHandler((error, request, reply) => {
    const latency = Date.now() - ((request.raw as any)._startTime ?? Date.now());
    const requestId = uuid();
    logRequest({
      ipHash: hashIp(request.ip),
      ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
      endpoint: request.routerPath ?? request.url,
      mode: typeof (request.body as any)?.mode === 'string' ? (request.body as any).mode : null,
      payload: { summary: summarizePayload(request.body ?? {}) },
      forwarded: false,
      status: 'error',
      latencyMs: latency,
      extra: { request_id: requestId }
    });
    sendError(reply, error);
  });

  fastify.post('/v1/execute', async (request, reply) => {
    const start = Date.now();
    const cfg = configRepo.getConfig();
    const riskConfig = createRiskConfig(cfg.riskKeywords);
    const body = request.body as any;
    ensureSafePayload(riskConfig, body);

    const requestId = uuid();
    let forwarded = false;
    let aiLog: any = null;
    const consentImprove = Boolean(body?.consent_improve);

    try {
      const result = await runAction(cfg, body, (info) => {
        forwarded = true;
        if (consentImprove) {
          aiLog = info;
        }
      });
      const latency = Date.now() - start;
      const meta: SuccessMeta = { request_id: requestId, latency_ms: latency };
      const response = { ...SUCCESS_TEMPLATE, meta, data: result };
      reply.send(response);
      const logId = logRequest({
        ipHash: hashIp(request.ip),
        ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
        endpoint: '/v1/execute',
        mode: body?.mode ?? null,
        payload: { summary: summarizePayload(body) },
        forwarded,
        status: 'ok',
        latencyMs: latency,
        extra: { request_id: requestId }
      });
      if (aiLog) {
        logAiCall({
          reqId: logId,
          provider: aiLog.provider,
          model: aiLog.model,
          promptName: aiLog.promptName,
          promptVersion: aiLog.promptVersion,
          inputTokens: aiLog.inputTokens ?? null,
          outputTokens: aiLog.outputTokens ?? null,
          latencyMs: aiLog.latencyMs,
          responseJson: aiLog.responseJson,
          extra: { consent_improve: consentImprove }
        });
      }
    } catch (error) {
      const latency = Date.now() - start;
      logRequest({
        ipHash: hashIp(request.ip),
        ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
        endpoint: '/v1/execute',
        mode: body?.mode ?? null,
        payload: { summary: summarizePayload(body) },
        forwarded,
        status: 'error',
        latencyMs: latency,
        extra: { request_id: requestId }
      });
      sendError(reply, error);
    }
  });

  fastify.post('/v1/help', async (request, reply) => {
    const start = Date.now();
    const cfg = configRepo.getConfig();
    const riskConfig = createRiskConfig(cfg.riskKeywords);
    const body = request.body as any;
    ensureSafePayload(riskConfig, body);

    const requestId = uuid();
    let forwarded = false;
    let aiLog: any = null;

    try {
      const result = await runHelp(cfg, body, (info) => {
        forwarded = true;
        aiLog = info;
      });
      const latency = Date.now() - start;
      const meta: SuccessMeta = { request_id: requestId, latency_ms: latency };
      const response = { ...SUCCESS_TEMPLATE, meta, data: result };
      reply.send(response);
      const logId = logRequest({
        ipHash: hashIp(request.ip),
        ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
        endpoint: '/v1/help',
        mode: body?.mode ?? null,
        payload: { summary: summarizePayload(body) },
        forwarded,
        status: 'ok',
        latencyMs: latency,
        extra: { request_id: requestId }
      });
      if (aiLog) {
        logAiCall({
          reqId: logId,
          provider: aiLog.provider,
          model: aiLog.model,
          promptName: aiLog.promptName,
          promptVersion: aiLog.promptVersion,
          inputTokens: aiLog.inputTokens ?? null,
          outputTokens: aiLog.outputTokens ?? null,
          latencyMs: aiLog.latencyMs,
          responseJson: aiLog.responseJson,
          extra: { consent_improve: false }
        });
      }
    } catch (error) {
      const latency = Date.now() - start;
      logRequest({
        ipHash: hashIp(request.ip),
        ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
        endpoint: '/v1/help',
        mode: body?.mode ?? null,
        payload: { summary: summarizePayload(body) },
        forwarded,
        status: 'error',
        latencyMs: latency,
        extra: { request_id: requestId }
      });
      sendError(reply, error);
    }
  });

  fastify.post('/v1/skip', async (request, reply) => {
    const start = Date.now();
    const cfg = configRepo.getConfig();
    const riskConfig = createRiskConfig(cfg.riskKeywords);
    const body = request.body as any;
    ensureSafePayload(riskConfig, body);

    const requestId = uuid();
    let forwarded = false;
    let aiLog: any = null;

    const actionPayload = {
      mode: 'action' as const,
      task: {
        title: body?.context?.task ?? '',
        history: [body?.context?.current ?? '']
      }
    };

    try {
      const result = await runAction(cfg, actionPayload, (info) => {
        forwarded = true;
        aiLog = info;
      });
      const latency = Date.now() - start;
      const meta: SuccessMeta = { request_id: requestId, latency_ms: latency };
      const response = { ...SUCCESS_TEMPLATE, meta, data: result };
      reply.send(response);
      const logId = logRequest({
        ipHash: hashIp(request.ip),
        ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
        endpoint: '/v1/skip',
        mode: body?.mode ?? null,
        payload: { summary: summarizePayload(body) },
        forwarded,
        status: 'ok',
        latencyMs: latency,
        extra: { request_id: requestId }
      });
      if (aiLog) {
        logAiCall({
          reqId: logId,
          provider: aiLog.provider,
          model: aiLog.model,
          promptName: aiLog.promptName,
          promptVersion: aiLog.promptVersion,
          inputTokens: aiLog.inputTokens ?? null,
          outputTokens: aiLog.outputTokens ?? null,
          latencyMs: aiLog.latencyMs,
          responseJson: aiLog.responseJson,
          extra: { consent_improve: false }
        });
      }
    } catch (error) {
      const latency = Date.now() - start;
      logRequest({
        ipHash: hashIp(request.ip),
        ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
        endpoint: '/v1/skip',
        mode: body?.mode ?? null,
        payload: { summary: summarizePayload(body) },
        forwarded,
        status: 'error',
        latencyMs: latency,
        extra: { request_id: requestId }
      });
      sendError(reply, error);
    }
  });

  fastify.post('/v1/guide', async (request, reply) => {
    const start = Date.now();
    const cfg = configRepo.getConfig();
    const riskConfig = createRiskConfig(cfg.riskKeywords);
    const body = request.body as any;
    ensureSafePayload(riskConfig, body);

    const requestId = uuid();
    let forwarded = false;
    let aiLog: any = null;

    try {
      const result = await runGuide(cfg, body, (info) => {
        forwarded = true;
        aiLog = info;
      });
      const latency = Date.now() - start;
      const meta: SuccessMeta = { request_id: requestId, latency_ms: latency };
      const response = { ...SUCCESS_TEMPLATE, meta, data: result };
      reply.send(response);
      const logId = logRequest({
        ipHash: hashIp(request.ip),
        ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
        endpoint: '/v1/guide',
        mode: body?.mode ?? null,
        payload: { summary: summarizePayload(body) },
        forwarded,
        status: 'ok',
        latencyMs: latency,
        extra: { request_id: requestId }
      });
      if (aiLog) {
        logAiCall({
          reqId: logId,
          provider: aiLog.provider,
          model: aiLog.model,
          promptName: aiLog.promptName,
          promptVersion: aiLog.promptVersion,
          inputTokens: aiLog.inputTokens ?? null,
          outputTokens: aiLog.outputTokens ?? null,
          latencyMs: aiLog.latencyMs,
          responseJson: aiLog.responseJson,
          extra: { consent_improve: false }
        });
      }
    } catch (error) {
      const latency = Date.now() - start;
      logRequest({
        ipHash: hashIp(request.ip),
        ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
        endpoint: '/v1/guide',
        mode: body?.mode ?? null,
        payload: { summary: summarizePayload(body) },
        forwarded,
        status: 'error',
        latencyMs: latency,
        extra: { request_id: requestId }
      });
      sendError(reply, error);
    }
  });

  fastify.post('/v1/feedback', async (request, reply) => {
    const start = Date.now();
    const body = request.body as any;
    db.prepare('INSERT INTO feedback (task_uuid, mode, rating, note, extra) VALUES (?, ?, ?, ?, ?)').run(
      body?.task_uuid ?? null,
      body?.mode ?? null,
      body?.rating ?? null,
      body?.note ?? null,
      JSON.stringify(body ?? {})
    );
    const latency = Date.now() - start;
    logRequest({
      ipHash: hashIp(request.ip),
      ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
      endpoint: '/v1/feedback',
      mode: body?.mode ?? null,
      payload: { summary: summarizePayload(body) },
      forwarded: false,
      status: 'ok',
      latencyMs: latency,
      extra: { request_id: uuid() }
    });
    reply.send({ ...SUCCESS_TEMPLATE, meta: { request_id: uuid(), latency_ms: latency }, data: {} });
  });

  fastify.post('/v1/consent', async (request, reply) => {
    const start = Date.now();
    const body = request.body as any;
    db.prepare('INSERT INTO consents (consented, extra) VALUES (?, ?)').run(body?.consented ? 1 : 0, JSON.stringify(body ?? {}));
    const latency = Date.now() - start;
    logRequest({
      ipHash: hashIp(request.ip),
      ua: typeof request.headers['user-agent'] === 'string' ? (request.headers['user-agent'] as string) : null,
      endpoint: '/v1/consent',
      mode: null,
      payload: { summary: summarizePayload(body) },
      forwarded: false,
      status: 'ok',
      latencyMs: latency,
      extra: { request_id: uuid() }
    });
    reply.send({ ...SUCCESS_TEMPLATE, meta: { request_id: uuid(), latency_ms: latency }, data: {} });
  });

  fastify.get('/healthz', async (_request, reply) => {
    reply.send({ status: 'ok' });
  });

  return fastify;
}
