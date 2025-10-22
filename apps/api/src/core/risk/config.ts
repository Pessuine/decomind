export interface RiskConfig {
  keywords: string[];
  maxBodyLength: number;
}

export function loadRiskConfig(): RiskConfig {
  const keywords = (process.env.RISK_KEYWORDS || "危害,违法,爆炸").split(",").map((k) => k.trim()).filter(Boolean);
  const maxBodyLength = Number(process.env.RISK_BODY_LIMIT || 4000);
  return { keywords, maxBodyLength };
}
