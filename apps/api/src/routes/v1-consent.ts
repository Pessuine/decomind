import type { FastifyInstance } from "fastify";
import { ConsentRequestSchema } from "@decompo/shared-schemas";

export function registerConsentRoute(app: FastifyInstance) {
  app.post("/v1/consent", async (request, reply) => {
    const start = Date.now();
    const parsed = ConsentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      throw new Error("VALIDATION_ERROR");
    }

    app.feedbackRepo.insertConsent({ consented: parsed.data.consented });

    const response = {
      version: 1,
      status: "ok" as const,
      meta: {
        request_id: request.id,
        latency_ms: Date.now() - start
      },
      data: {},
      error: null
    };

    reply.code(200);
    return response;
  });
}
