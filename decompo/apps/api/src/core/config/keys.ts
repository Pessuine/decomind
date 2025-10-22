import crypto from "crypto";

const KEY_ENV = process.env.CONFIG_SECRET || "decompo-secret-key";

export function encrypt(text: string) {
  if (!text) return "";
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash("sha256").update(KEY_ENV).digest();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(payload: string) {
  if (!payload) return "";
  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const data = buffer.subarray(28);
  const key = crypto.createHash("sha256").update(KEY_ENV).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
