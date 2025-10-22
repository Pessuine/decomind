import type { FastifyInstance } from "fastify";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { generateActionStep } from "../core/orchestrator/action.js";
import { validateActionStep } from "../core/postrules/validate.js";
import { ErrorCode } from "../core/errors/codes.js";

const RequestSchema = z.object({
  version: z.literal(1),
  mode: z.literal("action"),
  task: z.object({
    title: z.string().min(1),
    history: z.array(z.string()).max(50).optional().default([]),
  }),
  prefs: z.record(z.any()).optional(),
  consent_improve: z.boolean().optional(),
});

export async function registerExecuteRoute(app: FastifyInstance) {
  app.post("/v1/execute", async (request, reply) => {
    const start = Date.now();
    const parseResult = RequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      const err: any = new Error("Validation failed");
      err.code = ErrorCode.VALIDATION_ERROR;
      err.statusCode = 400;
      err.details = parseResult.error.flatten();
      throw err;
    }
    const body = parseResult.data;
    const rawStep = await generateActionStep(app.ctx.db, {
      taskTitle: body.task.title,
      history: body.task.history ?? [],
    });
    const step = validateActionStep(rawStep);
    const latency = Date.now() - start;
    return {
      version: 1,
      status: "ok" as const,
      meta: {
        request_id: uuid(),
        latency_ms: latency,
      },
      data: step,
      error: null,
    };
  });
}
