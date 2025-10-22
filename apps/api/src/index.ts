import { createServer } from "./server";

async function bootstrap() {
  const server = await createServer();
  const port = Number(process.env.PORT || process.env.API_PORT || 8080);
  const host = process.env.HOST || "0.0.0.0";

  try {
    await server.listen({ port, host });
    server.log.info({ port, host }, "API server started");
  } catch (error) {
    server.log.error({ err: error }, "Failed to start API server");
    process.exit(1);
  }
}

bootstrap();
