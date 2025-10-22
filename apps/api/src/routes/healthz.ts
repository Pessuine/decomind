import type { FastifyInstance } from "fastify";

export function registerHealthRoute(app: FastifyInstance) {
  app.get("/healthz", async () => ({ status: "ok" }));
}
