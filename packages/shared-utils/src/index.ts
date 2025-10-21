import crypto from 'crypto';
import { customAlphabet } from 'nanoid';

export interface ApiResponseMeta {
  request_id: string;
  latency_ms: number;
}

export interface ApiEnvelope<T> {
  version: number;
  status: 'ok' | 'error';
  meta: ApiResponseMeta;
  data: T | null;
  error: { code: string; message: string } | null;
}

const nanoid = customAlphabet('0123456789abcdef', 16);

export function createRequestId(): string {
  return nanoid();
}

export function buildOkResponse<T>(meta: ApiResponseMeta, data: T): ApiEnvelope<T> {
  return {
    version: 1,
    status: 'ok',
    meta,
    data,
    error: null,
  };
}

export function buildErrorResponse(meta: ApiResponseMeta, code: string, message: string): ApiEnvelope<null> {
  return {
    version: 1,
    status: 'error',
    meta,
    data: null,
    error: { code, message },
  };
}

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export function redactPayload(payload: unknown, maxLength = 512): string {
  try {
    const json = JSON.stringify(payload);
    if (!json) return '';
    if (json.length <= maxLength) return json;
    return json.slice(0, maxLength) + '…';
  } catch (err) {
    return '[unserializable payload]';
  }
}

export function maskToken(token: string, keep = 4): string {
  if (!token) return '';
  const visible = token.slice(-keep);
  return `${'*'.repeat(Math.max(token.length - keep, 0))}${visible}`;
}

export function parseBooleanFlag(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}
