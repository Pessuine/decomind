import crypto from 'crypto';

const ENCRYPTION_KEY = (process.env.SECRET_ENCRYPTION_KEY ?? '').padEnd(32, '0').slice(0, 32);
const IV_LENGTH = 12;

type CipherPayload = {
  iv: string;
  tag: string;
  value: string;
};

export function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload: CipherPayload = {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    value: encrypted.toString('base64')
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function decryptSecret(payload: string | null): string | null {
  if (!payload) {
    return null;
  }
  try {
    const decoded: CipherPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    const iv = Buffer.from(decoded.iv, 'base64');
    const tag = Buffer.from(decoded.tag, 'base64');
    const encryptedText = Buffer.from(decoded.value, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}
