import "dotenv/config";
import path from "path";
import { buildServer } from "./server";
import { createContext } from "./context";

const port = Number(process.env.PORT || 8080);
const allowLocalhost = process.env.ALLOW_LOCALHOST === "true";
const dbPath = process.env.DB_PATH ? path.resolve(__dirname, process.env.DB_PATH) : path.resolve(__dirname, "../data/app.db");

const context = createContext(dbPath);
const server = buildServer(context, { port, allowLocalhost });

server
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    server.log.info(`API listening on port ${port}`);
  })
  .catch((err) => {
    server.log.error(err, "failed to start server");
    process.exit(1);
  });
