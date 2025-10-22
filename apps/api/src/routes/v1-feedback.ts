import type { FastifyPluginAsync } from "fastify";
import { feedbackRequestSchema } from "@decomind/shared-schemas";
import { createSuccessResponse } from "../types/response";
import { sendError } from "../core/errors/handler";
import { getRequestId } from "../types/context";

const feedbackRoute: FastifyPluginAsync = async (server) => {
  const insert = server.db.prepare(
    `INSERT INTO feedback (task_uuid, mode, rating, note) VALUES (@task_uuid, @mode, @rating, @note)`
  );

  server.post("/v1/feedback", async (request, reply) => {
    const requestStarted = Date.now();
    const parsed = feedbackRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(reply, getRequestId(request), Date.now() - requestStarted, "VALIDATION_ERROR");
      return;
    }
    insert.run({
      task_uuid: parsed.data.task_uuid,
      mode: parsed.data.mode,
      rating: parsed.data.rating,
      note: parsed.data.note ?? null
    });
    const latency = Date.now() - requestStarted;
    reply.send(createSuccessResponse(getRequestId(request), latency, { acknowledged: true }));
  });
};

export default feedbackRoute;
