import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DecompoConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.resolve(__dirname, '../../..', '.env') });

const requiredEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const parseNumber = (value: string, defaultValue: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

export const getConfig = (): DecompoConfig => {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as DecompoConfig['nodeEnv'];
  return {
    nodeEnv,
    port: parseNumber(process.env.PORT ?? '3000', 3000),
    adminPasswordHash: requiredEnv('ADMIN_PASSWORD_HASH'),
    jwtSecret: requiredEnv('JWT_SECRET'),
    consentRetentionDays: parseNumber(process.env.CONSENT_RETENTION_DAYS ?? '365', 365),
    logRetentionDays: parseNumber(process.env.LOG_RETENTION_DAYS ?? '90', 90),
    databaseUrl: requiredEnv('DATABASE_URL'),
    allowedHosts: (process.env.ALLOWED_HOSTS ?? 'localhost,127.0.0.1').split(',').map((item) =>
      item.trim().toLowerCase()
    ),
    enableMockModel: process.env.QWEN_ENABLE_MOCK === 'true',
    encryptionKey: requiredEnv('CONFIG_ENCRYPTION_KEY')
  };
};

export * from './encryption.js';
export * from './types.js';
