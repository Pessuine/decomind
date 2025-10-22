import type Database from "better-sqlite3";
import { hashIp, summarizePayload } from "@decompo/shared-utils";

export interface RequestLogInput {
  ip?: string;
  ua?: string;
  endpoint: string;
  mode?: string | null;
  payload: unknown;
  forwarded: boolean;
  status: string;
  latencyMs: number;
  extra?: Record<string, unknown>;
}

export function insertRequestLog(db: Database.Database, input: RequestLogInput) {
  const stmt = db.prepare(
    `INSERT INTO request_logs (ip_hash, ua, endpoint, mode, payload_text, forwarded, status, latency_ms, extra)
     VALUES (@ip_hash, @ua, @endpoint, @mode, @payload_text, @forwarded, @status, @latency_ms, json(@extra))`
  );
  return stmt.run({
    ip_hash: input.ip ? hashIp(input.ip) : null,
    ua: input.ua || null,
    endpoint: input.endpoint,
    mode: input.mode ?? null,
    payload_text: summarizePayload(input.payload),
    forwarded: input.forwarded ? 1 : 0,
    status: input.status,
    latency_ms: input.latencyMs,
    extra: JSON.stringify(input.extra ?? {}),
  });
}

export interface AiLogInput {
  reqId: number;
  provider: string;
  model: string;
  promptName: string;
  promptVersion: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs: number;
  responseJson: unknown;
  extra?: Record<string, unknown>;
}

export function insertAiLog(db: Database.Database, input: AiLogInput) {
  const stmt = db.prepare(
    `INSERT INTO ai_calls (req_id, provider, model, prompt_name, prompt_version, input_tokens, output_tokens, latency_ms, response_json, extra)
     VALUES (@req_id, @provider, @model, @prompt_name, @prompt_version, @input_tokens, @output_tokens, @latency_ms, json(@response_json), json(@extra))`
  );
  stmt.run({
    req_id: input.reqId,
    provider: input.provider,
    model: input.model,
    prompt_name: input.promptName,
    prompt_version: input.promptVersion,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    latency_ms: input.latencyMs,
    response_json: JSON.stringify(input.responseJson ?? {}),
    extra: JSON.stringify(input.extra ?? {}),
  });
}
