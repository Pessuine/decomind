import type { AppDatabase } from "../config/database";
import { loadSystemConfig } from "../config/repo";

export interface RiskConfig {
  keywords: string[];
}

let cached: RiskConfig | null = null;
let lastLoaded = 0;

export function getRiskConfig(db: AppDatabase): RiskConfig {
  const now = Date.now();
  if (cached && now - lastLoaded < 60_000) {
    return cached;
  }
  const systemConfig = loadSystemConfig(db);
  const keywords = systemConfig.risk_keywords ? systemConfig.risk_keywords.split(",").map((s) => s.trim()).filter(Boolean) : [];
  cached = { keywords };
  lastLoaded = now;
  return cached;
}
