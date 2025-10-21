import { db } from './database.js';
import crypto from 'crypto';

interface SysConfig {
  app_domain: string;
  api_domain: string;
  admin_domain: string;
  enable_nginx: number;
  log_retention_days: number;
  risk_keywords: string;
  experience_sampling: number;
}

interface ModelConfig {
  provider: string;
  model_name: string;
  api_base: string;
  api_key_encrypted: string;
  temperature: number;
  max_tokens: number;
}

let sysCache: SysConfig | null = null;
let modelCache: ModelConfig | null = null;
let apiKeyCache: string | null = null;

const listeners: Array<() => void> = [];

export function loadSysConfig(): SysConfig {
  if (!sysCache) {
    const row = db.prepare('SELECT * FROM sys_config WHERE id = 1').get() as SysConfig | undefined;
    sysCache =
      row || ({
        app_domain: process.env.APP_DOMAIN || 'app.example.com',
        api_domain: process.env.API_DOMAIN || 'api.example.com',
        admin_domain: process.env.ADMIN_DOMAIN || 'another.com',
        enable_nginx: 0,
        log_retention_days: 30,
        risk_keywords: '',
        experience_sampling: 0
      } as SysConfig);
  }
  return sysCache;
}

export function loadModelConfig(): ModelConfig {
  if (!modelCache) {
    const row = db
      .prepare('SELECT provider, model_name, api_base, api_key_encrypted, temperature, max_tokens FROM model_settings ORDER BY updated_at DESC LIMIT 1')
      .get() as ModelConfig | undefined;
    modelCache =
      row || ({
        provider: 'qwen',
        model_name: process.env.MODEL_NAME || 'qwen-max',
        api_base: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        api_key_encrypted: '',
        temperature: Number(process.env.TEMPERATURE || 0.6),
        max_tokens: Number(process.env.MAX_TOKENS || 256)
      } as ModelConfig);
  }
  return modelCache;
}

export function updateCaches() {
  sysCache = null;
  modelCache = null;
  apiKeyCache = null;
  listeners.forEach((fn) => fn());
}

export function onConfigUpdate(fn: () => void) {
  listeners.push(fn);
}

const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || 'decomind-default-key-32bytes!';
const KEY_BUFFER = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

export function decryptApiKey(): string {
  if (apiKeyCache) return apiKeyCache;
  const cfg = loadModelConfig();
  if (!cfg || !cfg.api_key_encrypted) return '';
  const payload = Buffer.from(cfg.api_key_encrypted, 'base64');
  const iv = payload.subarray(0, 16);
  const content = payload.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
  const text = Buffer.concat([decipher.update(content), decipher.final()]).toString('utf-8');
  apiKeyCache = text;
  return text;
}

export function encryptApiKey(raw: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  const content = Buffer.concat([cipher.update(raw, 'utf-8'), cipher.final()]);
  return Buffer.concat([iv, content]).toString('base64');
}
