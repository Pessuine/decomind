import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ErrorCode } from "../core/errors/codes.js";

const RequestSchema = z.object({
  version: z.literal(1),
  task_uuid: z.string().uuid(),
  mode: z.enum(["action", "guide"]),
  rating: z.enum(["good", "bad", "neutral"]),
  note: z.string().max(500).optional(),
});

export async function registerFeedbackRoute(app: FastifyInstance) {
  app.post("/v1/feedback", async (request) => {
    const parseResult = RequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      const err: any = new Error("Validation failed");
      err.code = ErrorCode.VALIDATION_ERROR;
      err.statusCode = 400;
      err.details = parseResult.error.flatten();
      throw err;
    }
    const body = parseResult.data;
    const stmt = app.ctx.db.prepare(
      `INSERT INTO feedback (task_uuid, mode, rating, note, extra) VALUES (?, ?, ?, ?, json('{}'))`
    );
    stmt.run(body.task_uuid, body.mode, body.rating, body.note ?? null);
    return {
      version: 1,
      status: "ok" as const,
      data: {},
    };
  });
}
