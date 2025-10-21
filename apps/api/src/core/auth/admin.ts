import argon2 from 'argon2';
import speakeasy from 'speakeasy';
import { randomUUID } from 'crypto';

const sessions = new Map<string, number>();

function cleanupSessions() {
  const now = Date.now();
  for (const [token, expiry] of sessions.entries()) {
    if (expiry <= now) sessions.delete(token);
  }
}

export async function verifyAdmin(password: string, totp: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.TOTP_SECRET;
  if (!hash || !secret) {
    throw new Error('ADMIN_NOT_CONFIGURED');
  }
  const ok = await argon2.verify(hash, password);
  const totpOk = speakeasy.totp.verify({ secret, encoding: 'base32', token: totp, window: 1 });
  if (!ok || !totpOk) return null;
  cleanupSessions();
  const token = randomUUID();
  sessions.set(token, Date.now() + 1000 * 60 * 60 * 8);
  return token;
}

export function requireAdmin(token?: string) {
  cleanupSessions();
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (expiry < Date.now()) {
    sessions.delete(token);
    return false;
  }
  sessions.set(token, Date.now() + 1000 * 60 * 60 * 8);
  return true;
}
