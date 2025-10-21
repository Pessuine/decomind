import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    requestContext: {
      start: number;
      requestId: string;
      logId?: number;
    };
  }
}
