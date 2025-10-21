import { z } from 'zod';

export const ActionMode = z.literal('action');

export const ExecuteRequestSchema = z.object({
  version: z.number().int().min(1),
  mode: ActionMode,
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
  consent_improve: z.boolean().default(false)
});

export const ActionStepSchema = z.object({
  step: z.object({ type: z.literal('action'), text: z.string().min(1) }),
  progress: z
    .object({
      current: z.number().int().nonnegative(),
      total: z.number().int().positive(),
      percent: z.number().min(0).max(100)
    })
    .optional(),
  menu: z
    .array(
      z.object({ key: z.enum(['simpler', 'alt', 'hint', 'split']), label: z.string() })
    )
    .optional()
});

export const HelpRequestSchema = z.object({
  version: z.number().int().min(1),
  mode: ActionMode,
  action: z.enum(['simpler', 'alt', 'hint', 'split']),
  context: z.object({
    current: z.string().min(1),
    task: z.string().min(1)
  })
});

export const SkipRequestSchema = z.object({
  version: z.number().int().min(1),
  mode: ActionMode,
  context: z.object({ current: z.string().min(1), task: z.string().min(1) })
});

export const GuideRequestSchema = z.object({
  version: z.number().int().min(1),
  topic: z.string().min(1),
  depth: z.enum(['light', 'normal', 'deep']).default('normal')
});

export const GuideOutlineSchema = z.object({
  outline: z.array(
    z.object({
      title: z.string(),
      steps: z.array(z.string()).optional(),
      children: z.lazy(() => GuideOutlineSchema.shape.outline).optional()
    })
  )
});

export const FeedbackRequestSchema = z.object({
  version: z.number().int().min(1),
  task_uuid: z.string().min(1),
  mode: ActionMode,
  rating: z.enum(['good', 'bad', 'neutral']),
  note: z.string().optional()
});

export const ConsentRequestSchema = z.object({
  version: z.number().int().min(1),
  consented: z.boolean()
});

export const ActionResponseSchema = z.object({
  version: z.number().int(),
  status: z.literal('ok'),
  meta: z.object({ request_id: z.string(), latency_ms: z.number() }),
  data: z.object({
    step: z.object({ type: z.literal('action'), text: z.string() }),
    progress: ActionStepSchema.shape.progress.optional(),
    menu: ActionStepSchema.shape.menu.optional()
  }),
  error: z.null()
});

export const ErrorResponseSchema = z.object({
  version: z.number().int(),
  status: z.literal('error'),
  error: z.object({ code: z.string(), message: z.string() })
});

export type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;
export type HelpRequest = z.infer<typeof HelpRequestSchema>;
export type SkipRequest = z.infer<typeof SkipRequestSchema>;
export type GuideRequest = z.infer<typeof GuideRequestSchema>;
export type GuideOutline = z.infer<typeof GuideOutlineSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
export type ConsentRequest = z.infer<typeof ConsentRequestSchema>;
export type ActionResponse = z.infer<typeof ActionResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
