import crypto from "node:crypto";

const SECRET = process.env.CONFIG_SECRET || "decompo-secret";

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(SECRET).digest();
  const cipher = crypto.createCipheriv("aes-256-ctr", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(payload: string): string {
  const [ivHex, dataHex] = payload.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const key = crypto.createHash("sha256").update(SECRET).digest();
  const decipher = crypto.createDecipheriv("aes-256-ctr", key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
