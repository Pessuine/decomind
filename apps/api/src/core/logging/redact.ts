import { summarizePayload } from "@decompo/shared-utils";

export function buildPayloadSnapshot(payload: unknown): string {
  return summarizePayload(payload, 512);
}
