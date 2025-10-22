export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse<T> {
  data: T;
  raw: unknown;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  latencyMs: number;
}
