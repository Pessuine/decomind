import type { FastifyInstance } from "fastify";
import { SkipRequestSchema } from "@decompo/shared-schemas";
import { runHelpStep } from "../core/orchestrator/help";

export function registerSkipRoute(app: FastifyInstance) {
  app.post("/v1/skip", async (request, reply) => {
    const start = Date.now();
    const parsed = SkipRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      throw new Error("VALIDATION_ERROR");
    }
    const body = parsed.data;

    const result = await runHelpStep(app.aiProvider, app.promptRepo, {
      action: "alt",
      context: body.context
    });

    (request as any).pendingAiLogs.push({
      provider: "qwen",
      model: "qwen-max",
      promptName: result.promptName,
      promptVersion: result.promptVersion,
      responseJson: result.raw.data,
      latencyMs: result.raw.latencyMs,
      usage: result.raw.usage
    });

    const response = {
      version: 1,
      status: "ok" as const,
      meta: {
        request_id: request.id,
        latency_ms: Date.now() - start
      },
      data: result.payload,
      error: null
    };

    reply.code(200);
    return response;
  });
}
