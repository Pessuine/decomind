import { db } from '../database';

export type RequestLogInput = {
  ipHash: string | null;
  ua: string | null;
  endpoint: string;
  mode: string | null;
  payload: unknown;
  forwarded: boolean;
  status: string;
  latencyMs: number;
  extra?: Record<string, unknown>;
};

export type AiCallLogInput = {
  reqId: number;
  provider: string;
  model: string;
  promptName: string;
  promptVersion: number;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  responseJson: unknown;
  extra?: Record<string, unknown>;
};

const insertRequest = db.prepare(
  `INSERT INTO request_logs (ip_hash, ua, endpoint, mode, payload_text, forwarded, status, latency_ms, extra)
   VALUES (@ipHash, @ua, @endpoint, @mode, @payloadText, @forwarded, @status, @latencyMs, @extra)`
);

const insertAiCall = db.prepare(
  `INSERT INTO ai_calls (req_id, provider, model, prompt_name, prompt_version, input_tokens, output_tokens, latency_ms, response_json, extra)
   VALUES (@reqId, @provider, @model, @promptName, @promptVersion, @inputTokens, @outputTokens, @latencyMs, @responseJson, @extra)`
);

export function logRequest(input: RequestLogInput): number {
  const payloadText = (() => {
    try {
      return JSON.stringify(input.payload ?? null);
    } catch {
      return '[unserializable]';
    }
  })();

  const result = insertRequest.run({
    ipHash: input.ipHash,
    ua: input.ua,
    endpoint: input.endpoint,
    mode: input.mode,
    payloadText,
    forwarded: input.forwarded ? 1 : 0,
    status: input.status,
    latencyMs: input.latencyMs,
    extra: input.extra ? JSON.stringify(input.extra) : null
  });

  return Number(result.lastInsertRowid);
}

export function logAiCall(input: AiCallLogInput) {
  insertAiCall.run({
    reqId: input.reqId,
    provider: input.provider,
    model: input.model,
    promptName: input.promptName,
    promptVersion: input.promptVersion,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    latencyMs: input.latencyMs,
    responseJson: JSON.stringify(input.responseJson ?? null),
    extra: input.extra ? JSON.stringify(input.extra) : null
  });
}
