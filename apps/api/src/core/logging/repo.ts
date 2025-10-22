import type { FastifyBaseLogger } from "fastify";
import type { AppDatabase } from "../config/database";
import { hashIp, summarizeRequest } from "./redact";

export interface RequestLogContext {
  id?: number;
  endpoint: string;
  mode: string | null;
  forwarded: boolean;
  status: string;
  latencyMs: number;
  extra?: Record<string, unknown>;
}

export function createRequestLogger(db: AppDatabase, logger: FastifyBaseLogger) {
  const insert = db.prepare(
    `INSERT INTO request_logs (ip_hash, ua, endpoint, mode, payload_text, forwarded, status, latency_ms, extra)
     VALUES (@ip_hash, @ua, @endpoint, @mode, @payload_text, @forwarded, @status, @latency_ms, @extra)`
  );

  return function logRequest(request: Parameters<typeof summarizeRequest>[0], context: RequestLogContext) {
    try {
      const payloadText = summarizeRequest(request);
      const ipHash = hashIp(request.ip);
      insert.run({
        ip_hash: ipHash,
        ua: request.headers["user-agent"] ?? null,
        endpoint: context.endpoint,
        mode: context.mode,
        payload_text: payloadText,
        forwarded: context.forwarded ? 1 : 0,
        status: context.status,
        latency_ms: context.latencyMs,
        extra: context.extra ? JSON.stringify(context.extra) : null
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to write request log");
    }
  };
}
