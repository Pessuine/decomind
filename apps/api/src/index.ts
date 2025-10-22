import './load-env';
import { runMigrations } from './core/database';
import { ConfigRepository } from './core/config/repo';
import { createServer } from './server';

async function bootstrap() {
  runMigrations();
  const configRepo = new ConfigRepository();
  const server = createServer(configRepo);
  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? '0.0.0.0';
  try {
    await server.listen({ port, host });
    server.log.info(`API listening on ${host}:${port}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

bootstrap();
