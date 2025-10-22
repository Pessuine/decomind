import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ErrorCode } from "../core/errors/codes.js";

const RequestSchema = z.object({
  version: z.literal(1),
  consented: z.boolean(),
});

export async function registerConsentRoute(app: FastifyInstance) {
  app.post("/v1/consent", async (request) => {
    const parseResult = RequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      const err: any = new Error("Validation failed");
      err.code = ErrorCode.VALIDATION_ERROR;
      err.statusCode = 400;
      err.details = parseResult.error.flatten();
      throw err;
    }
    const body = parseResult.data;
    app.ctx.db.prepare(`INSERT INTO consents (consented, extra) VALUES (?, json('{}'))`).run(body.consented ? 1 : 0);
    return {
      version: 1,
      status: "ok" as const,
      data: {},
    };
  });
}
