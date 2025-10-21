import { config as loadEnv } from 'dotenv';
import path from 'path';

const envPath = process.env.API_ENV_PATH || path.resolve(__dirname, '../.env');
loadEnv({ path: envPath });

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 8080),
  APP_DOMAIN: requireEnv('APP_DOMAIN'),
  API_DOMAIN: requireEnv('API_DOMAIN'),
  ADMIN_DOMAIN: requireEnv('ADMIN_DOMAIN'),
  ALLOW_LOCALHOST: process.env.ALLOW_LOCALHOST === 'true' || process.env.ALLOW_LOCALHOST === '1',
  QWEN_BASE_URL: requireEnv('QWEN_BASE_URL'),
  QWEN_API_KEY: requireEnv('QWEN_API_KEY'),
  MODEL_NAME: process.env.MODEL_NAME ?? 'qwen-max',
  TEMPERATURE: Number(process.env.TEMPERATURE ?? 0.6),
  MAX_TOKENS: Number(process.env.MAX_TOKENS ?? 256),
  DB_PATH: requireEnv('DB_PATH', '../data/app.db'),
  ADMIN_PASSWORD_HASH: requireEnv('ADMIN_PASSWORD_HASH'),
  CONFIG_SECRET: process.env.CONFIG_SECRET ?? requireEnv('ADMIN_PASSWORD_HASH'),
};
