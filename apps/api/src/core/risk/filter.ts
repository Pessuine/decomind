import type { RiskConfig } from "./config";

export function assessRisk(text: string, config: RiskConfig): void {
  if (text.length > config.maxTaskLength) {
    throw new Error("RISK_BLOCKED");
  }
  for (const keyword of config.keywords) {
    if (text.includes(keyword)) {
      throw new Error("RISK_BLOCKED");
    }
  }
}
