import type { FastifyRequest } from "fastify";
import { nanoid } from "nanoid";

export function getRequestId(request: FastifyRequest): string {
  if (typeof request.id === "string") {
    return request.id;
  }
  try {
    return String(request.id);
  } catch {
    return nanoid();
  }
}
