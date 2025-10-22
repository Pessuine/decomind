import argon2 from "argon2";

export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password is required");
  }
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash || !password) {
    return false;
  }
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

export function redactPayload(payload: unknown, maxLength = 500): string {
  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length <= maxLength) {
      return serialized;
    }
    return serialized.slice(0, maxLength) + "…";
  } catch {
    return "[unserializable]";
  }
}
