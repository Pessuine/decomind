import type { FastifyInstance } from "fastify";
import { ExecuteRequestSchema } from "@decompo/shared-schemas";
import { runActionStep } from "../core/orchestrator/action";
import { defaultRiskConfig } from "../core/risk/config";
import { assessRisk } from "../core/risk/filter";

export function registerExecuteRoute(app: FastifyInstance) {
  app.post("/v1/execute", async (request, reply) => {
    const start = Date.now();
    const parsed = ExecuteRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      throw new Error("VALIDATION_ERROR");
    }
    const body = parsed.data;

    assessRisk(body.task.title, defaultRiskConfig);

    const result = await runActionStep(app.aiProvider, app.promptRepo, {
      task: body.task,
      prefs: body.prefs,
      consentImprove: body.consent_improve
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
