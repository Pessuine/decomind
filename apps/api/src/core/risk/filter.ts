import { RiskConfig, loadRiskConfig } from './config';

let cachedConfig: RiskConfig | null = null;
let lastLoaded = 0;

function getConfig(): RiskConfig {
  const now = Date.now();
  if (!cachedConfig || now - lastLoaded > 60_000) {
    cachedConfig = loadRiskConfig();
    lastLoaded = now;
  }
  return cachedConfig;
}

export function checkRisk(payload: unknown): string | null {
  const cfg = getConfig();
  const text = JSON.stringify(payload ?? {});
  if (text.length > cfg.maxPayloadLength) {
    return 'Payload too large';
  }
  for (const keyword of cfg.keywords) {
    if (keyword && text.includes(keyword)) {
      return `Contains blocked keyword: ${keyword}`;
    }
  }
  return null;
}
