import { z } from "zod";

export const ActionModeSchema = z.enum(["action"]);

const historySchema = z.array(z.string()).max(50);

export const ExecuteRequestSchema = z.object({
  version: z.literal(1),
  mode: ActionModeSchema,
  task: z.object({
    title: z.string().min(1).max(120),
    history: historySchema.default([])
  }),
  prefs: z
    .object({
      tone: z.string().optional(),
      intensity: z.string().optional()
    })
    .default({}),
  consent_improve: z.boolean().default(false)
});

export const HelpRequestSchema = z.object({
  version: z.literal(1),
  mode: ActionModeSchema,
  action: z.enum(["simpler", "alt", "hint", "split"]),
  context: z.object({
    current: z.string().min(1).max(120),
    task: z.string().min(1).max(120)
  })
});

export const SkipRequestSchema = z.object({
  version: z.literal(1),
  mode: ActionModeSchema,
  context: z.object({
    current: z.string().min(1).max(120),
    task: z.string().min(1).max(120)
  })
});

export const GuideRequestSchema = z.object({
  version: z.literal(1),
  topic: z.string().min(1).max(160),
  depth: z.string().optional()
});

export const FeedbackRequestSchema = z.object({
  version: z.literal(1),
  task_uuid: z.string().uuid(),
  mode: z.enum(["action", "guide"]),
  rating: z.enum(["good", "bad", "neutral"]),
  note: z.string().max(500).optional()
});

export const ConsentRequestSchema = z.object({
  version: z.literal(1),
  consented: z.boolean()
});
