import { z } from 'zod';

export const ActionStepSchema = z.object({
  step: z.object({
    type: z.literal('action'),
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
        key: z.enum(['simpler', 'alt', 'hint', 'split']),
        label: z.string().min(1)
      })
    )
    .optional()
});

export const HelpResponseSchema = z.object({
  step: z.object({
    type: z.literal('action'),
    text: z.string().min(1)
  })
});

export const GuideOutlineItemSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    title: z.string().min(1),
    steps: z.array(z.string().min(1)).optional(),
    children: z.array(GuideOutlineItemSchema).optional()
  })
);

export const GuideResponseSchema = z.object({
  outline: z.array(GuideOutlineItemSchema)
});

export type ActionStep = z.infer<typeof ActionStepSchema>;
export type HelpResponse = z.infer<typeof HelpResponseSchema>;
export type GuideResponse = z.infer<typeof GuideResponseSchema>;
