import { FastifyInstance } from "fastify";

export function registerHealthzRoute(server: FastifyInstance) {
  server.get("/healthz", async () => ({ status: "ok" }));
}
