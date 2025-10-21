import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import argon2 from 'argon2';
import speakeasy from 'speakeasy';
import { buildOkResponse } from '@decomind/shared-utils';
import { ENV } from '../env';
import { createAdminSession } from '../core/admin/session';
import { insertRequestLog } from '../core/logging/repo';
import { ApiError, handleUnknownError } from '../core/errors/handler';

const loginSchema = z.object({
  password: z.string().min(1),
  totp: z.string().min(6).max(6),
});

export function registerAdminLogin(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/admin/login', {
    schema: { body: loginSchema },
  }, async (request, reply) => {
    try {
      const { body } = request;
      const passwordValid = await argon2.verify(ENV.ADMIN_PASSWORD_HASH, body.password);
      const totpValid = speakeasy.totp.verify({
        secret: ENV.TOTP_SECRET,
        encoding: 'base32',
        token: body.totp,
        window: 1,
      });
      if (!passwordValid || !totpValid) {
        throw new ApiError('VALIDATION_ERROR', '认证失败', 401);
      }
      const token = createAdminSession();
      const meta = { request_id: request.requestContext.requestId, latency_ms: Date.now() - request.requestContext.start };
      const response = buildOkResponse(meta, { token });
      if (!request.requestContext.logId) {
        const log = insertRequestLog({
          ip: request.ip,
          ua: request.headers['user-agent'] ?? '',
          endpoint: '/admin/login',
          mode: 'admin',
          payload: { hasPassword: !!body.password, hasTotp: !!body.totp },
          forwarded: Boolean(request.headers['x-forwarded-for']),
          status: 'ok',
          latency: meta.latency_ms,
        });
        request.requestContext.logId = log.id;
      }
      return reply.status(200).send(response);
    } catch (err) {
      return handleUnknownError(reply, request, err);
    }
  });
}
