import type { FastifyPluginAsync } from "fastify";
import { consentRequestSchema } from "@decomind/shared-schemas";
import { createSuccessResponse } from "../types/response";
import { sendError } from "../core/errors/handler";
import { getRequestId } from "../types/context";

const consentRoute: FastifyPluginAsync = async (server) => {
  const insert = server.db.prepare(`INSERT INTO consents (consented) VALUES (?)`);

  server.post("/v1/consent", async (request, reply) => {
    const requestStarted = Date.now();
    const parsed = consentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, getRequestId(request), Date.now() - requestStarted, "VALIDATION_ERROR");
      return;
    }
    insert.run(parsed.data.consented ? 1 : 0);
    const latency = Date.now() - requestStarted;
    reply.send(createSuccessResponse(getRequestId(request), latency, { acknowledged: true }));
  });
};

export default consentRoute;
