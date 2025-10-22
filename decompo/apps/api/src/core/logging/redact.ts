import crypto from "crypto";
import { summarizePayload } from "@decompo/shared-utils";

export function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export function summarizeRequest(payload: unknown) {
  return summarizePayload(payload, 4096);
}
