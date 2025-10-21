import type { FastifyInstance } from 'fastify';

export function registerHealthz(app: FastifyInstance) {
  app.get('/healthz', async () => ({ status: 'ok' }));
}
