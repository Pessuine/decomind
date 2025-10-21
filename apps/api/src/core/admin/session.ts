import NodeCache from 'node-cache';
import crypto from 'crypto';

const sessionCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

export function createAdminSession(): string {
  const token = crypto.randomUUID();
  sessionCache.set(token, true, 3600);
  return token;
}

export function validateAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  const exists = sessionCache.get<boolean>(token);
  return Boolean(exists);
}
