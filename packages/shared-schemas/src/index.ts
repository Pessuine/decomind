import { z } from 'zod';

export const stepSchema = z.object({
  type: z.literal('action'),
  text: z.string().min(1).max(200),
});

export const progressSchema = z.object({
  current: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  percent: z.number().int().min(0).max(100),
});

export const menuItemSchema = z.object({
  key: z.enum(['simpler', 'alt', 'hint', 'split']),
  label: z.string().min(1).max(50),
});

export const actionResponseSchema = z.object({
  step: stepSchema,
  progress: progressSchema.optional(),
  menu: z.array(menuItemSchema).optional(),
});

export const actionRequestSchema = z.object({
  version: z.literal(1),
  mode: z.enum(['action']),
  task: z.object({
    title: z.string().min(1),
    history: z.array(z.string()).default([]),
  }),
  prefs: z
    .object({
      tone: z.string().optional(),
      intensity: z.string().optional(),
    })
    .optional(),
  consent_improve: z.boolean().optional(),
});

export const helpRequestSchema = z.object({
  version: z.literal(1),
  mode: z.enum(['action']),
  action: z.enum(['simpler', 'alt', 'hint', 'split']),
  context: z.object({
    current: z.string().min(1),
    task: z.string().min(1),
  }),
});

export const skipRequestSchema = z.object({
  version: z.literal(1),
  mode: z.enum(['action']),
  context: z.object({
    current: z.string().min(1),
    task: z.string().min(1),
  }),
});

export const guideRequestSchema = z.object({
  version: z.literal(1),
  topic: z.string().min(1),
  depth: z.enum(['light', 'normal', 'deep']).default('normal'),
});

export const guideOutlineSchema = z.object({
  outline: z
    .array(
      z.object({
        title: z.string().min(1),
        steps: z.array(z.string().min(1)).optional(),
        children: z.lazy(() => guideOutlineSchema.shape.outline).optional(),
      }),
    )
    .min(1),
});

export const feedbackRequestSchema = z.object({
  version: z.literal(1),
  task_uuid: z.string().uuid(),
  mode: z.enum(['action']),
  rating: z.enum(['good', 'bad', 'neutral']),
  note: z.string().max(1000).optional().default(''),
});

export const consentRequestSchema = z.object({
  version: z.literal(1),
  consented: z.boolean(),
});

export type ActionRequest = z.infer<typeof actionRequestSchema>;
export type HelpRequest = z.infer<typeof helpRequestSchema>;
export type SkipRequest = z.infer<typeof skipRequestSchema>;
export type GuideRequest = z.infer<typeof guideRequestSchema>;
export type ActionResponse = z.infer<typeof actionResponseSchema>;
export type GuideOutline = z.infer<typeof guideOutlineSchema>;
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
export type ConsentRequest = z.infer<typeof consentRequestSchema>;
