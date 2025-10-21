import { db } from '../config/database.js';
import { hashIp, redactPayload } from '@decomind/shared-utils';

export interface RequestLogMeta {
  id: number;
}

type RequestLogParams = {
  ip?: string;
  ua?: string;
  endpoint: string;
  mode?: string | null;
  payload?: unknown;
  forwarded?: boolean;
};

export function createRequestLog(params: RequestLogParams): RequestLogMeta {
  const stmt = db.prepare(
    `INSERT INTO request_logs (ip_hash, ua, endpoint, mode, payload_text, forwarded, status)
     VALUES (@ip_hash, @ua, @endpoint, @mode, @payload_text, @forwarded, 'pending')`
  );
  const info = stmt.run({
    ip_hash: params.ip ? hashIp(params.ip) : null,
    ua: params.ua || '',
    endpoint: params.endpoint,
    mode: params.mode ?? null,
    payload_text: redactPayload(params.payload),
    forwarded: params.forwarded ? 1 : 0
  });
  return { id: Number(info.lastInsertRowid) };
}

export function finalizeRequestLog(meta: RequestLogMeta, status: string, latency: number, extra: Record<string, unknown> = {}) {
  db.prepare('UPDATE request_logs SET status = ?, latency_ms = ?, extra = json(?) WHERE id = ?').run(
    status,
    Math.round(latency),
    JSON.stringify(extra),
    meta.id
  );
}

export function writeAiCall(args: {
  reqId: number;
  provider: string;
  model: string;
  promptName: string;
  promptVersion: number;
  latencyMs: number;
  responseJson: unknown;
  tokens?: { input?: number; output?: number };
}) {
  db.prepare(
    `INSERT INTO ai_calls (req_id, provider, model, prompt_name, prompt_version, latency_ms, response_json, input_tokens, output_tokens)
     VALUES (@req_id, @provider, @model, @prompt_name, @prompt_version, @latency_ms, @response_json, @input_tokens, @output_tokens)`
  ).run({
    req_id: args.reqId,
    provider: args.provider,
    model: args.model,
    prompt_name: args.promptName,
    prompt_version: args.promptVersion,
    latency_ms: Math.round(args.latencyMs),
    response_json: JSON.stringify(args.responseJson),
    input_tokens: args.tokens?.input ?? null,
    output_tokens: args.tokens?.output ?? null
  });
}
