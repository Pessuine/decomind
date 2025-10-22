import type { AppDatabase } from "../config/database";

interface AiLogOptions {
  requestLogId?: number;
  provider: string;
  model: string;
  promptName: string;
  promptVersion: number;
  latencyMs: number;
  responseJson: unknown;
  inputTokens?: number;
  outputTokens?: number;
}

export function createAiLogger(db: AppDatabase) {
  const statement = db.prepare(
    `INSERT INTO ai_calls (req_id, provider, model, prompt_name, prompt_version, input_tokens, output_tokens, latency_ms, response_json)
     VALUES (@req_id, @provider, @model, @prompt_name, @prompt_version, @input_tokens, @output_tokens, @latency_ms, @response_json)`
  );

  return function logAiCall(options: AiLogOptions) {
    statement.run({
      req_id: options.requestLogId ?? null,
      provider: options.provider,
      model: options.model,
      prompt_name: options.promptName,
      prompt_version: options.promptVersion,
      input_tokens: options.inputTokens ?? null,
      output_tokens: options.outputTokens ?? null,
      latency_ms: options.latencyMs,
      response_json: JSON.stringify(options.responseJson)
    });
  };
}
