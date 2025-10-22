import type { FastifyInstance } from "fastify";
import { FeedbackRequestSchema } from "@decompo/shared-schemas";

export function registerFeedbackRoute(app: FastifyInstance) {
  app.post("/v1/feedback", async (request, reply) => {
    const start = Date.now();
    const parsed = FeedbackRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      throw new Error("VALIDATION_ERROR");
    }
    const body = parsed.data;

    app.feedbackRepo.insertFeedback({
      task_uuid: body.task_uuid,
      mode: body.mode,
      rating: body.rating,
      note: body.note
    });

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
