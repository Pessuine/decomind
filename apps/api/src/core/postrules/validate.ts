import { ActionStepSchema, GuideOutlineSchema } from "./schema.js";
import { ErrorCode } from "../errors/codes.js";

export function validateActionStep(payload: unknown) {
  const result = ActionStepSchema.safeParse(payload);
  if (!result.success) {
    const err = new Error("Action schema validation failed");
    (err as any).code = ErrorCode.MODEL_FORMAT_ERROR;
    (err as any).statusCode = 502;
    (err as any).details = result.error.flatten();
    throw err;
  }
  return result.data;
}

export function validateGuideOutline(payload: unknown) {
  const result = GuideOutlineSchema.safeParse(payload);
  if (!result.success) {
    const err = new Error("Guide schema validation failed");
    (err as any).code = ErrorCode.MODEL_FORMAT_ERROR;
    (err as any).statusCode = 502;
    (err as any).details = result.error.flatten();
    throw err;
  }
  return result.data;
}
