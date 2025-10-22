import type { FastifyPluginAsync } from "fastify";
import { guideRequestSchema } from "@decomind/shared-schemas";
import { createSuccessResponse } from "../types/response";
import { sendError } from "../core/errors/handler";
import { getRequestId } from "../types/context";
import { handleGuide } from "../core/orchestrator/guide";

const guideRoute: FastifyPluginAsync = async (server) => {
  server.post("/v1/guide", async (request, reply) => {
    const requestStarted = Date.now();
    const parsed = guideRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, getRequestId(request), Date.now() - requestStarted, "VALIDATION_ERROR");
      return;
    }
    const result = await handleGuide(server.db, parsed.data);
    const latency = Date.now() - requestStarted;
    reply.send(createSuccessResponse(getRequestId(request), latency, result.response));
  });
};

export default guideRoute;
