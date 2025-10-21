import { getRiskKeywords } from './config.js';

export function checkRisk(text: string) {
  const keywords = getRiskKeywords();
  for (const word of keywords) {
    if (word && text.includes(word)) {
      return word;
    }
  }
  return null;
}

export function enforcePayloadLimits(payload: unknown) {
  const serialized = JSON.stringify(payload || {});
  if (serialized.length > 4000) {
    throw new Error('PAYLOAD_TOO_LARGE');
  }
}
