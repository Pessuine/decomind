import crypto from 'crypto';

type RedactOptions = {
  maxLength?: number;
};

export function hashIp(ip: string | undefined | null): string | null {
  if (!ip) {
    return null;
  }
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export function summarizePayload(payload: unknown, options: RedactOptions = {}): string {
  const maxLength = options.maxLength ?? 400;
  try {
    const json = JSON.stringify(payload);
    if (json.length <= maxLength) {
      return json;
    }
    return json.slice(0, maxLength) + '…';
  } catch {
    return '[unserializable]';
  }
}
