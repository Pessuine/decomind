import { z } from "zod";

export const ActionStepSchema = z.object({
  step: z.object({
    type: z.literal("action"),
    text: z.string().min(1).max(120)
  }),
  progress: z
    .object({
      current: z.number().int().min(0),
      total: z.number().int().min(1),
      percent: z.number().int().min(0).max(100)
    })
    .optional(),
  menu: z
    .array(
      z.object({
        key: z.enum(["simpler", "alt", "hint", "split"]),
        label: z.string().min(1).max(30)
      })
    )
    .optional()
});

export const HelpStepSchema = z.object({
  step: z.object({
    type: z.literal("action"),
    text: z.string().min(1).max(120)
  })
});

export const GuideOutlineSchema = z.object({
  outline: z.array(
    z.object({
      title: z.string().min(1).max(120),
      steps: z.array(z.string().min(1).max(160)).optional(),
      children: z.lazy(() => GuideOutlineSchema.shape.outline).optional()
    })
  )
});
