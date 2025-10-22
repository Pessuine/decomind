import { z } from "zod";

export const VersionHeaderSchema = z.literal(1);

export const ActionExecuteRequestSchema = z.object({
  version: VersionHeaderSchema,
  mode: z.literal("action"),
  task: z.object({
    title: z.string().min(1).max(120),
    history: z.array(z.string()).max(50).optional(),
  }),
  prefs: z
    .object({
      tone: z.string().optional(),
      intensity: z.string().optional(),
    })
    .optional(),
  consent_improve: z.boolean().optional(),
});

export const ActionStepSchema = z.object({
  step: z.object({
    type: z.literal("action"),
    text: z.string().min(1).max(200),
  }),
  progress: z
    .object({
      current: z.number().int().nonnegative(),
      total: z.number().int().positive(),
      percent: z.number().min(0).max(100),
    })
    .optional(),
  menu: z
    .array(
      z.object({
        key: z.enum(["simpler", "alt", "hint", "split"]),
        label: z.string().min(1).max(32),
      })
    )
    .optional(),
});

export const ActionExecuteResponseSchema = z.object({
  version: VersionHeaderSchema,
  status: z.literal("ok"),
  meta: z.object({
    request_id: z.string(),
    latency_ms: z.number().int().nonnegative(),
  }),
  data: ActionStepSchema,
  error: z.null(),
});

export const ErrorResponseSchema = z.object({
  version: VersionHeaderSchema,
  status: z.literal("error"),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ActionExecuteRequest = z.infer<typeof ActionExecuteRequestSchema>;
export type ActionStep = z.infer<typeof ActionStepSchema>;
