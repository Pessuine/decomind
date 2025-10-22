import { ActionStepSchema, GuideOutlineSchema, HelpStepSchema } from "./schema";

export function validateActionStep(payload: unknown) {
  return ActionStepSchema.parse(payload);
}

export function validateHelpStep(payload: unknown) {
  return HelpStepSchema.parse(payload);
}

export function validateGuideOutline(payload: unknown) {
  return GuideOutlineSchema.parse(payload);
}
