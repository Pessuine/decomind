import { ENV } from './env';
import { createServer } from './server';

async function bootstrap() {
  const server = await createServer();
  try {
    await server.listen({ port: ENV.PORT, host: '0.0.0.0' });
    console.log(`[api] listening on port ${ENV.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

bootstrap();
