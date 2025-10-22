import { createServer } from "./server";
import { loadEnvConfig } from "./utils/env";

async function main() {
  const config = loadEnvConfig();
  const server = await createServer({ config });

  const port = Number(config.API_PORT || 8080);
  const host = "0.0.0.0";
  try {
    await server.listen({ port, host });
    server.log.info({ port }, "API server started");
  } catch (err) {
    server.log.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

void main();
