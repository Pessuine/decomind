import type { FastifyPluginAsync } from "fastify";
import { skipRequestSchema } from "@decomind/shared-schemas";
import { createSuccessResponse } from "../types/response";
import { sendError } from "../core/errors/handler";
import { getRequestId } from "../types/context";
import { handleSkip } from "../core/orchestrator/action";

const skipRoute: FastifyPluginAsync = async (server) => {
  server.post("/v1/skip", async (request, reply) => {
    const requestStarted = Date.now();
    const parsed = skipRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, getRequestId(request), Date.now() - requestStarted, "VALIDATION_ERROR");
      return;
    }
    const result = await handleSkip(server.db, parsed.data);
    const latency = Date.now() - requestStarted;
    reply.send(createSuccessResponse(getRequestId(request), latency, result.response));
  });
};

export default skipRoute;
