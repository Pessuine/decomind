export interface AiCallOptions {
  model: string;
  messages: Array<{ role: string; content: string }>;
  response_format?: { type: string };
  temperature?: number;
  max_tokens?: number;
}

export interface AiProvider {
  callJson(options: AiCallOptions): Promise<unknown>;
}
