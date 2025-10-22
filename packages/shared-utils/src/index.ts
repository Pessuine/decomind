import crypto from "node:crypto";
import argon2 from "argon2";

export function redactPayload(payload: unknown, maxLength = 512): string {
  try {
    const serialized = JSON.stringify(payload);
    if (!serialized) {
      return "";
    }
    return serialized.length > maxLength
      ? serialized.slice(0, maxLength) + "…"
      : serialized;
  } catch (err) {
    return "[unserializable payload]";
  }
}

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export function summarizePayload(payload: unknown, maxLength = 256): string {
  const text = redactPayload(payload, maxLength);
  return text.replace(/\s+/g, " ").trim();
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
