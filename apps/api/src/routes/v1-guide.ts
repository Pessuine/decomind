import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateGuideOutline } from "../core/orchestrator/guide.js";
import { validateGuideOutline } from "../core/postrules/validate.js";
import { ErrorCode } from "../core/errors/codes.js";

const RequestSchema = z.object({
  version: z.literal(1),
  topic: z.string().min(1),
  depth: z.enum(["light", "normal", "deep"]).default("normal"),
});

export async function registerGuideRoute(app: FastifyInstance) {
  app.post("/v1/guide", async (request) => {
    const parseResult = RequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      const err: any = new Error("Validation failed");
      err.code = ErrorCode.VALIDATION_ERROR;
      err.statusCode = 400;
      err.details = parseResult.error.flatten();
      throw err;
    }
    const body = parseResult.data;
    const rawOutline = await generateGuideOutline(app.ctx.db, {
      topic: body.topic,
      depth: body.depth,
    });
    const outline = validateGuideOutline(rawOutline);
    return {
      version: 1,
      status: "ok" as const,
      data: outline,
    };
  });
}
