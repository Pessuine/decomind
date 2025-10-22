import { z } from "zod";

export const versionedRequestSchema = z.object({
  version: z.literal(1)
});

export const executeRequestSchema = versionedRequestSchema.extend({
  mode: z.literal("action"),
  task: z.object({
    title: z.string().min(1),
    history: z.array(z.string()).default([])
  }),
  prefs: z
    .object({
      tone: z.string().optional(),
      intensity: z.string().optional()
    })
    .default({}),
  consent_improve: z.boolean().optional()
});

export const helpRequestSchema = versionedRequestSchema.extend({
  mode: z.literal("action"),
  action: z.enum(["simpler", "alt", "hint", "split"]),
  context: z.object({
    current: z.string(),
    task: z.string()
  })
});

export const skipRequestSchema = versionedRequestSchema.extend({
  mode: z.literal("action"),
  context: z.object({
    current: z.string(),
    task: z.string()
  })
});

export const guideRequestSchema = versionedRequestSchema.extend({
  topic: z.string(),
  depth: z.enum(["light", "normal", "deep"]).default("normal")
});

export const feedbackRequestSchema = versionedRequestSchema.extend({
  task_uuid: z.string(),
  mode: z.literal("action"),
  rating: z.enum(["good", "bad", "neutral"]),
  note: z.string().optional()
});

export const consentRequestSchema = versionedRequestSchema.extend({
  consented: z.boolean()
});

export const actionStepSchema = z.object({
  step: z.object({
    type: z.literal("action"),
    text: z.string().min(1)
  }),
  progress: z
    .object({
      current: z.number().int().nonnegative(),
      total: z.number().int().positive(),
      percent: z.number().min(0).max(100)
    })
    .optional(),
  menu: z
    .array(
      z.object({
        key: z.enum(["simpler", "alt", "hint", "split"]),
        label: z.string()
      })
    )
    .optional()
});

export const guideOutlineSchema = z.object({
  outline: z.array(
    z.object({
      title: z.string(),
      steps: z.array(z.string()).optional(),
      children: z.array(z.any()).optional()
    })
  )
});

export type ExecuteRequest = z.infer<typeof executeRequestSchema>;
export type HelpRequest = z.infer<typeof helpRequestSchema>;
export type SkipRequest = z.infer<typeof skipRequestSchema>;
export type GuideRequest = z.infer<typeof guideRequestSchema>;
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
export type ConsentRequest = z.infer<typeof consentRequestSchema>;
export type ActionStepResponse = z.infer<typeof actionStepSchema>;
export type GuideOutlineResponse = z.infer<typeof guideOutlineSchema>;
