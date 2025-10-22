import { z } from "zod";

export const ActionStepSchema = z.object({
  step: z.object({
    type: z.literal("action"),
    text: z.string().min(1),
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
        key: z.string().min(1),
        label: z.string().min(1),
      })
    )
    .optional(),
});

export type ActionStep = z.infer<typeof ActionStepSchema>;

export const HelpResultSchema = z.object({
  step: z.object({
    type: z.literal("action"),
    text: z.string().min(1),
  }),
});

export type HelpResult = z.infer<typeof HelpResultSchema>;

const OutlineNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    title: z.string().min(1),
    steps: z.array(z.string().min(1)).optional(),
    children: z.array(OutlineNodeSchema).optional(),
  })
);

export const GuideOutlineSchema = z.object({
  outline: z.array(OutlineNodeSchema),
});

export type GuideOutline = z.infer<typeof GuideOutlineSchema>;

export const ApiResponseEnvelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    version: z.literal(1),
    status: z.union([z.literal("ok"), z.literal("error")]),
    meta: z
      .object({
        request_id: z.string().uuid(),
        latency_ms: z.number().int().nonnegative(),
      })
      .optional(),
    data,
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .nullable(),
  });

export const ConsentRequestSchema = z.object({
  version: z.literal(1),
  consented: z.boolean(),
});

export const FeedbackRequestSchema = z.object({
  version: z.literal(1),
  task_uuid: z.string().min(1),
  mode: z.string().min(1),
  rating: z.enum(["good", "bad", "neutral"]),
  note: z.string().optional(),
});

export const ExecuteRequestSchema = z.object({
  version: z.literal(1),
  mode: z.literal("action"),
  task: z.object({
    title: z.string().min(1),
    history: z.array(z.string()),
  }),
  prefs: z
    .object({
      tone: z.string().optional(),
      intensity: z.string().optional(),
    })
    .optional(),
  consent_improve: z.boolean().optional(),
});

export const HelpRequestSchema = z.object({
  version: z.literal(1),
  mode: z.literal("action"),
  action: z.enum(["simpler", "alt", "hint", "split"]),
  context: z.object({
    current: z.string().min(1),
    task: z.string().min(1),
  }),
});

export const SkipRequestSchema = z.object({
  version: z.literal(1),
  mode: z.literal("action"),
  context: z.object({
    current: z.string().min(1),
    task: z.string().min(1),
  }),
});

export const GuideRequestSchema = z.object({
  version: z.literal(1),
  topic: z.string().min(1),
  depth: z.string().min(1),
});

export type ConsentRequest = z.infer<typeof ConsentRequestSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
export type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;
export type HelpRequest = z.infer<typeof HelpRequestSchema>;
export type SkipRequest = z.infer<typeof SkipRequestSchema>;
export type GuideRequest = z.infer<typeof GuideRequestSchema>;
