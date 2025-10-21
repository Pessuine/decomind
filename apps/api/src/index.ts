import { createServer } from './server.js';

async function main() {
  const server = await createServer();
  const port = Number(process.env.PORT || 8080);
  try {
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`API listening on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
