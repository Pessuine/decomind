import { RiskConfig } from './config';

export function ensureSafePayload(config: RiskConfig, payload: unknown) {
  const serialized = (() => {
    try {
      return JSON.stringify(payload) ?? '';
    } catch {
      return '';
    }
  })();

  if (serialized.length > config.maxPayloadLength) {
    throw new Error('RISK_BLOCKED:payload_too_large');
  }

  const lower = serialized.toLowerCase();
  for (const keyword of config.keywords) {
    if (keyword && lower.includes(keyword)) {
      throw new Error('RISK_BLOCKED:keyword');
    }
  }
}
