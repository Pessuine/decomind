import { db } from '../../db';
import { hashIp, redactPayload } from '@decomind/shared-utils';

interface LogOptions {
  ip?: string;
  ua?: string;
  endpoint: string;
  mode?: string;
  payload?: unknown;
  forwarded: boolean;
  status: string;
  latency: number;
  extra?: Record<string, unknown>;
}

export function insertRequestLog(opts: LogOptions) {
  const stmt = db.prepare(
    `INSERT INTO request_logs (ip_hash, ua, endpoint, mode, payload_text, forwarded, status, latency_ms, extra)
     VALUES (@ip_hash, @ua, @endpoint, @mode, @payload_text, @forwarded, @status, @latency_ms, json(@extra))`,
  );
  const payloadText = redactPayload(opts.payload);
  stmt.run({
    ip_hash: opts.ip ? hashIp(opts.ip) : null,
    ua: opts.ua ?? '',
    endpoint: opts.endpoint,
    mode: opts.mode ?? '',
    payload_text: payloadText,
    forwarded: opts.forwarded ? 1 : 0,
    status: opts.status,
    latency_ms: opts.latency,
    extra: JSON.stringify(opts.extra ?? {}),
  });
  return db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
}

interface AiLogOptions {
  reqId: number;
  provider: string;
  model: string;
  promptName: string;
  promptVersion: number;
  inputTokens?: number;
  outputTokens?: number;
  latency: number;
  responseJson: unknown;
  extra?: Record<string, unknown>;
}

export function insertAiCall(opts: AiLogOptions) {
  const stmt = db.prepare(
    `INSERT INTO ai_calls (req_id, provider, model, prompt_name, prompt_version, input_tokens, output_tokens, latency_ms, response_json, extra)
     VALUES (@req_id, @provider, @model, @prompt_name, @prompt_version, @input_tokens, @output_tokens, @latency_ms, @response_json, json(@extra))`,
  );
  stmt.run({
    req_id: opts.reqId,
    provider: opts.provider,
    model: opts.model,
    prompt_name: opts.promptName,
    prompt_version: opts.promptVersion,
    input_tokens: opts.inputTokens ?? null,
    output_tokens: opts.outputTokens ?? null,
    latency_ms: opts.latency,
    response_json: JSON.stringify(opts.responseJson ?? {}),
    extra: JSON.stringify(opts.extra ?? {}),
  });
}
