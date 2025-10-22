import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    startedAt?: number;
    isLogged?: boolean;
    requestLogId?: number | null;
    pendingAiLogs?: Array<{
      provider: string;
      model: string;
      promptName: string;
      promptVersion: number;
      responseJson: unknown;
      latencyMs: number;
      usage?: { input_tokens?: number; output_tokens?: number };
    }>;
  }
}
