import Database from "better-sqlite3";
import { hashIp, summarizeRequest } from "./redact";

export interface RequestLogRecord {
  id?: number;
  ts?: string;
  ip?: string;
  ua?: string;
  endpoint: string;
  mode?: string;
  payload?: unknown;
  forwarded?: boolean;
  status?: string;
  latencyMs?: number;
  extra?: any;
}

export class LoggingRepository {
  constructor(private db: Database.Database) {}

  createRequestLog(entry: RequestLogRecord) {
    const stmt = this.db.prepare(
      `INSERT INTO request_logs (ip_hash, ua, endpoint, mode, payload_text, forwarded, status, latency_ms, extra)
       VALUES (@ip_hash, @ua, @endpoint, @mode, @payload_text, @forwarded, @status, @latency_ms, @extra)`
    );
    const payloadText = summarizeRequest(entry.payload ?? "");
    const info = stmt.run({
      ip_hash: entry.ip ? hashIp(entry.ip) : null,
      ua: entry.ua ?? null,
      endpoint: entry.endpoint,
      mode: entry.mode ?? null,
      payload_text: payloadText,
      forwarded: entry.forwarded ? 1 : 0,
      status: entry.status ?? null,
      latency_ms: entry.latencyMs ?? null,
      extra: entry.extra ? JSON.stringify(entry.extra) : null,
    });
    return info.lastInsertRowid as number;
  }

  finalizeRequestLog(id: number, info: { status?: string; latencyMs?: number }) {
    this.db
      .prepare(`UPDATE request_logs SET status = @status, latency_ms = @latency_ms WHERE id = @id`)
      .run({ id, status: info.status ?? null, latency_ms: info.latencyMs ?? null });
  }

  insertAiCall(opts: {
    reqId: number;
    provider: string;
    model: string;
    promptName: string;
    promptVersion: number;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
    responseJson: any;
    extra?: any;
  }) {
    const stmt = this.db.prepare(
      `INSERT INTO ai_calls (req_id, provider, model, prompt_name, prompt_version, input_tokens, output_tokens, latency_ms, response_json, extra)
       VALUES (@req_id, @provider, @model, @prompt_name, @prompt_version, @input_tokens, @output_tokens, @latency_ms, @response_json, @extra)`
    );
    stmt.run({
      req_id: opts.reqId,
      provider: opts.provider,
      model: opts.model,
      prompt_name: opts.promptName,
      prompt_version: opts.promptVersion,
      input_tokens: opts.inputTokens ?? null,
      output_tokens: opts.outputTokens ?? null,
      latency_ms: opts.latencyMs ?? null,
      response_json: JSON.stringify(opts.responseJson ?? {}),
      extra: opts.extra ? JSON.stringify(opts.extra) : null,
    });
  }
}
