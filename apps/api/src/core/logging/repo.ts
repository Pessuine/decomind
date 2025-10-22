import type Database from "better-sqlite3";
import type { FastifyReply, FastifyRequest } from "fastify";
import { hashIP, redactPayload } from "@decompo/shared-utils";

interface LogRequestOptions {
  request: FastifyRequest;
  reply: FastifyReply;
  latencyMs: number;
}

export interface LoggingRepo {
  logRequest(options: LogRequestOptions): Promise<number>;
  logAICall(options: {
    reqId: number;
    provider: string;
    model: string;
    promptName: string;
    promptVersion: number;
    responseJson: unknown;
    latencyMs: number;
    usage?: { input_tokens?: number; output_tokens?: number };
  }): Promise<void>;
}

export function createLoggingRepo(db: Database.Database, ipSecret: string): LoggingRepo {
  const insertRequest = db.prepare(
    `INSERT INTO request_logs (ip_hash, ua, endpoint, mode, payload_text, forwarded, status, latency_ms, extra)
     VALUES (@ip_hash, @ua, @endpoint, @mode, @payload_text, @forwarded, @status, @latency_ms, json(@extra))`
  );

  const insertAICall = db.prepare(
    `INSERT INTO ai_calls (req_id, provider, model, prompt_name, prompt_version, input_tokens, output_tokens, latency_ms, response_json, extra)
     VALUES (@req_id, @provider, @model, @prompt_name, @prompt_version, @input_tokens, @output_tokens, @latency_ms, json(@response_json), json(@extra))`
  );

  return {
    async logRequest({ request, reply, latencyMs }: LogRequestOptions) {
      const payload = request.body ?? null;
      const mode = typeof (payload as any)?.mode === "string" ? (payload as any).mode : null;
      const summary = redactPayload(payload);
      const status = reply.statusCode >= 400 ? "error" : "ok";
      const info = {
        ip_hash: request.ip ? hashIP(request.ip, ipSecret) : null,
        ua: request.headers["user-agent"] ?? null,
        endpoint: request.routerPath ?? request.url,
        mode,
        payload_text: summary,
        forwarded: 0,
        status,
        latency_ms: latencyMs,
        extra: JSON.stringify({ request_id: request.id, statusCode: reply.statusCode })
      };
      const result = insertRequest.run(info);
      return Number(result.lastInsertRowid);
    },
    async logAICall({ reqId, provider, model, promptName, promptVersion, responseJson, latencyMs, usage }) {
      insertAICall.run({
        req_id: reqId,
        provider,
        model,
        prompt_name: promptName,
        prompt_version: promptVersion,
        input_tokens: usage?.input_tokens ?? null,
        output_tokens: usage?.output_tokens ?? null,
        latency_ms: latencyMs,
        response_json: JSON.stringify(responseJson),
        extra: JSON.stringify({})
      });
    }
  };
}
