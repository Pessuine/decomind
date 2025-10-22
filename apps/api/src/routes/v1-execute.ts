import type { FastifyPluginAsync } from "fastify";
import { executeRequestSchema } from "@decomind/shared-schemas";
import { createSuccessResponse } from "../types/response";
import { sendError } from "../core/errors/handler";
import { getRequestId } from "../types/context";
import { handleExecute } from "../core/orchestrator/action";
import { PROMPT_NAMES } from "../core/prompts/names";

const executeRoute: FastifyPluginAsync = async (server) => {
  server.post("/v1/execute", async (request, reply) => {
    const requestStarted = Date.now();
    const parsed = executeRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      const latency = Date.now() - requestStarted;
      sendError(reply, getRequestId(request), latency, "VALIDATION_ERROR");
      return;
    }

    const result = await handleExecute(server.db, parsed.data);
    const latency = Date.now() - requestStarted;
    if (parsed.data.consent_improve) {
      server.logAiCall({
        provider: "template",
        model: "rule-based",
        promptName: PROMPT_NAMES.ACTION_STEP,
        promptVersion: result.promptVersion,
        latencyMs: latency,
        responseJson: result.response
      });
    }
    const response = createSuccessResponse(getRequestId(request), latency, result.response);
    reply.send(response);
  });
};

export default executeRoute;
