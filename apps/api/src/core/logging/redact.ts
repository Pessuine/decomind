import { createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { redactPayload } from "@decomind/shared-utils";

export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

export function summarizeRequest(request: FastifyRequest): string {
  const body = request.body ?? {};
  return redactPayload(body, 400);
}
