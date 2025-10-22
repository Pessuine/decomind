import type { FastifyInstance } from "fastify";
import { GuideRequestSchema } from "@decompo/shared-schemas";
import { runGuideOutline } from "../core/orchestrator/guide";

export function registerGuideRoute(app: FastifyInstance) {
  app.post("/v1/guide", async (request, reply) => {
    const start = Date.now();
    const parsed = GuideRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      throw new Error("VALIDATION_ERROR");
    }
    const body = parsed.data;

    const result = await runGuideOutline(app.aiProvider, app.promptRepo, body);

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
