import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateHelpStep } from "../core/orchestrator/help.js";
import { validateActionStep } from "../core/postrules/validate.js";
import { ErrorCode } from "../core/errors/codes.js";

const RequestSchema = z.object({
  version: z.literal(1),
  mode: z.literal("action"),
  context: z.object({
    current: z.string().min(1),
    task: z.string().min(1),
  }),
});

export async function registerSkipRoute(app: FastifyInstance) {
  app.post("/v1/skip", async (request) => {
    const parseResult = RequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      const err: any = new Error("Validation failed");
      err.code = ErrorCode.VALIDATION_ERROR;
      err.statusCode = 400;
      err.details = parseResult.error.flatten();
      throw err;
    }
    const body = parseResult.data;
    const rawStep = await generateHelpStep(app.ctx.db, {
      action: "alt",
      context: body.context,
    });
    const step = validateActionStep(rawStep);
    return {
      version: 1,
      status: "ok" as const,
      data: step,
    };
  });
}
