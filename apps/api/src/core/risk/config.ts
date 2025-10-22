export type RiskConfig = {
  keywords: string[];
  maxPayloadLength: number;
};

export function createRiskConfig(keywords: string[]): RiskConfig {
  return {
    keywords: keywords.map((k) => k.toLowerCase()),
    maxPayloadLength: Number(process.env.RISK_MAX_PAYLOAD_LENGTH ?? 4000)
  };
}
