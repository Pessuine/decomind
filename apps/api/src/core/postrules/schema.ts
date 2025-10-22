import { z } from "zod";

export const ActionStepSchema = z.object({
  step: z.object({
    type: z.literal("action"),
    text: z.string().min(2).max(120).regex(/^[\p{Letter}0-9]/u),
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

export const GuideOutlineSchema = z.object({
  outline: z.array(
    z.object({
      title: z.string().min(1).max(60),
      steps: z.array(z.string().min(1).max(120)).optional(),
      children: z.lazy(() => GuideOutlineSchema.shape.outline).optional(),
    })
  ),
});
