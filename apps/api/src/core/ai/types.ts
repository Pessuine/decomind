export interface AiCallOptions {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  response_format?: { type: "json_object" };
}

export interface AiCallResult {
  json: unknown;
  latencyMs: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}
