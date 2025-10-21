import { loadSysConfig } from '../config/repo.js';

export function getRiskKeywords(): string[] {
  const cfg = loadSysConfig();
  if (!cfg?.risk_keywords) return [];
  return cfg.risk_keywords.split(',').map((k) => k.trim()).filter(Boolean);
}

export function isExperienceSamplingEnabled() {
  const cfg = loadSysConfig();
  return cfg?.experience_sampling === 1;
}
