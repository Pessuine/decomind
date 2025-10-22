import { z } from "zod";
import { schemas } from "./schema";

export function assertActionStep(payload: unknown) {
  return schemas.actionStep.parse(payload);
}

export function assertGuideOutline(payload: unknown) {
  return schemas.guideOutline.parse(payload);
}

export function assertJson<T>(schema: z.ZodType<T>, payload: unknown): T {
  return schema.parse(payload);
}
