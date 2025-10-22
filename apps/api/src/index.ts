import { config } from "dotenv";
import { createServer } from "./server.js";

config();

const port = Number(process.env.PORT || 8080);

async function main() {
  const server = await createServer();
  try {
    await server.listen({ port, host: "0.0.0.0" });
    server.log.info({ port }, "API gateway started");
  } catch (err) {
    server.log.error(err, "Failed to start server");
    process.exit(1);
  }
}

main();
