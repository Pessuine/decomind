import { db } from '../../db';

export interface RiskConfig {
  keywords: string[];
  maxPayloadLength: number;
}

const DEFAULT_CONFIG: RiskConfig = {
  keywords: ['违法', '自杀', '爆炸'],
  maxPayloadLength: 4096,
};

export function loadRiskConfig(): RiskConfig {
  const row = db.prepare('SELECT risk_keywords FROM sys_config WHERE id = 1').get() as { risk_keywords?: string } | undefined;
  if (!row || !row.risk_keywords) return DEFAULT_CONFIG;
  const keywords = row.risk_keywords.split(',').map((k) => k.trim()).filter(Boolean);
  return {
    keywords: keywords.length ? keywords : DEFAULT_CONFIG.keywords,
    maxPayloadLength: DEFAULT_CONFIG.maxPayloadLength,
  };
}
