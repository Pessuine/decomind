import { ZodSchema } from "zod";

export function ensureJson<T>(schema: ZodSchema<T>, payload: unknown) {
  return schema.parse(payload);
}
