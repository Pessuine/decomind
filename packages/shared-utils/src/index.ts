import CryptoJS from 'crypto-js';

export function hashIp(ip: string) {
  return CryptoJS.SHA256(ip).toString(CryptoJS.enc.Hex).slice(0, 32);
}

export function redactPayload(payload: unknown, maxLength = 512) {
  try {
    const raw = JSON.stringify(payload ?? {});
    const text = typeof raw === 'string' ? raw : '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  } catch {
    return '[unserializable]';
  }
}

export interface ApiResponse<T> {
  version: number;
  status: 'ok' | 'error';
  meta?: { request_id: string; latency_ms: number };
  data: T | null;
  error: null | { code: string; message: string };
}

export function success<T>(data: T, meta: ApiResponse<T>['meta']): ApiResponse<T> {
  return { version: 1, status: 'ok', meta, data, error: null };
}

export function failure(code: string, message: string): ApiResponse<null> {
  return { version: 1, status: 'error', data: null, error: { code, message } };
}

export function ensureSingleSentence(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^[请我你我们现在首先]/.test(trimmed)) return false;
  return /^[\p{L}]/u.test(trimmed) && !/[。！？.!?].*[\p{L}]/u.test(trimmed.slice(trimmed.search(/[。！？.!?]/u) + 1));
}
