import type { FastifyPluginAsync } from "fastify";
import { helpRequestSchema } from "@decomind/shared-schemas";
import { createSuccessResponse } from "../types/response";
import { sendError } from "../core/errors/handler";
import { getRequestId } from "../types/context";
import { handleHelp } from "../core/orchestrator/action";

const helpRoute: FastifyPluginAsync = async (server) => {
  server.post("/v1/help", async (request, reply) => {
    const requestStarted = Date.now();
    const parsed = helpRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, getRequestId(request), Date.now() - requestStarted, "VALIDATION_ERROR");
      return;
    }
    const result = await handleHelp(server.db, parsed.data);
    const latency = Date.now() - requestStarted;
    reply.send(createSuccessResponse(getRequestId(request), latency, result.response));
  });
};

export default helpRoute;
