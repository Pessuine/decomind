import { FastifyInstance } from 'fastify';

export default async function healthRoute(fastify: FastifyInstance) {
  fastify.get('/healthz', async () => {
    return { status: 'ok' };
  });
}
