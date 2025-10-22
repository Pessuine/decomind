export type ProviderResponse<T> = {
  json: T;
  latencyMs: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
