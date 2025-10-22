import { RiskConfig, defaultRiskConfig } from "./config";

export class RiskFilter {
  private cfg: RiskConfig;

  constructor(config?: Partial<RiskConfig>) {
    this.cfg = { ...defaultRiskConfig, ...config } as RiskConfig;
  }

  update(config: RiskConfig) {
    this.cfg = config;
  }

  checkPayload(payload: string) {
    const size = Buffer.byteLength(payload);
    if (size > this.cfg.maxBodySize) {
      return {
        blocked: true,
        reason: "PAYLOAD_TOO_LARGE",
      } as const;
    }
    const hit = this.cfg.keywords.find((k) => k && payload.includes(k));
    if (hit) {
      return {
        blocked: true,
        reason: "KEYWORD",
        keyword: hit,
      } as const;
    }
    return { blocked: false } as const;
  }
}
