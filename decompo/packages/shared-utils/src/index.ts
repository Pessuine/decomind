import argon2 from "argon2";
import CryptoJS from "crypto-js";

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export function redactSensitive(input: string, maxLength = 2048) {
  const truncated = input.length > maxLength ? input.slice(0, maxLength) + "…" : input;
  return truncated
    .replace(/\b\d{11}\b/g, "***masked-phone***")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "***masked-email***")
    .replace(/\b\d{17}[\dX]\b/g, "***masked-id***");
}

export function summarizePayload(payload: unknown, maxLength = 2048) {
  const json = typeof payload === "string" ? payload : JSON.stringify(payload);
  return redactSensitive(json, maxLength);
}

export function encryptSecret(secret: string, key: string) {
  const cipher = CryptoJS.AES.encrypt(secret, key);
  return cipher.toString();
}

export function decryptSecret(cipherText: string, key: string) {
  if (!cipherText) return "";
  const bytes = CryptoJS.AES.decrypt(cipherText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export const ERROR_CODES = {
  MODEL_TIMEOUT: "MODEL_TIMEOUT",
  MODEL_FORMAT_ERROR: "MODEL_FORMAT_ERROR",
  RISK_BLOCKED: "RISK_BLOCKED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  HOST_FORBIDDEN: "HOST_FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

export type ErrorCode = keyof typeof ERROR_CODES;
