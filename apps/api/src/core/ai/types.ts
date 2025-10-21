export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface JsonResponseFormat {
  type: 'json_object';
}

export interface ProviderResponse<T> {
  json: T;
  latencyMs: number;
  usage?: { promptTokens?: number; completionTokens?: number };
}
