import { z } from "zod";

export const BaseResponseSchema = z.object({
  version: z.literal(1),
  status: z.enum(["ok", "error"]),
  meta: z
    .object({
      request_id: z.string().uuid(),
      latency_ms: z.number().int().nonnegative()
    })
    .optional(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string()
    })
    .nullable()
});

export type BaseResponse = z.infer<typeof BaseResponseSchema>;
