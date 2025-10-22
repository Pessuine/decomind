import { db } from '../database';
import { decryptSecret } from './keys';

export type RuntimeConfig = {
  appDomain: string;
  apiDomain: string;
  adminDomain: string;
  allowLocalhost: boolean;
  enableNginx: boolean;
  logRetentionDays: number;
  riskKeywords: string[];
  model: {
    provider: string;
    modelName: string;
    apiBase: string;
    apiKey: string | null;
    temperature: number;
    maxTokens: number;
  };
};

const DEFAULT_CONFIG: RuntimeConfig = {
  appDomain: process.env.APP_DOMAIN ?? 'app.example.com',
  apiDomain: process.env.API_DOMAIN ?? 'api.example.com',
  adminDomain: process.env.ADMIN_DOMAIN ?? 'another.com',
  allowLocalhost: (process.env.ALLOW_LOCALHOST ?? 'true').toLowerCase() === 'true',
  enableNginx: false,
  logRetentionDays: Number(process.env.LOG_RETENTION_DAYS ?? 30),
  riskKeywords: (process.env.RISK_KEYWORDS ?? '').split(',').map((v) => v.trim()).filter(Boolean),
  model: {
    provider: 'qwen',
    modelName: process.env.MODEL_NAME ?? 'qwen-max',
    apiBase: process.env.QWEN_BASE_URL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.QWEN_API_KEY ?? null,
    temperature: Number(process.env.TEMPERATURE ?? 0.6),
    maxTokens: Number(process.env.MAX_TOKENS ?? 256)
  }
};

type SysConfigRow = {
  app_domain: string | null;
  api_domain: string | null;
  admin_domain: string | null;
  enable_nginx: number | null;
  log_retention_days: number | null;
  risk_keywords: string | null;
};

type ModelSettingsRow = {
  provider: string | null;
  model_name: string | null;
  api_base: string | null;
  api_key_encrypted: string | null;
  temperature: number | null;
  max_tokens: number | null;
};

export class ConfigRepository {
  private cache: RuntimeConfig = { ...DEFAULT_CONFIG };
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly refreshIntervalMs = Number(process.env.CONFIG_REFRESH_MS ?? 10000)) {
    this.refresh();
    if (this.refreshIntervalMs > 0) {
      this.timer = setInterval(() => this.refresh(), this.refreshIntervalMs);
    }
  }

  refresh() {
    const sysConfig = db.prepare<SysConfigRow>('SELECT * FROM sys_config WHERE id = 1').get();
    if (sysConfig) {
      this.cache = {
        ...this.cache,
        appDomain: sysConfig.app_domain ?? this.cache.appDomain,
        apiDomain: sysConfig.api_domain ?? this.cache.apiDomain,
        adminDomain: sysConfig.admin_domain ?? this.cache.adminDomain,
        enableNginx: Boolean(sysConfig.enable_nginx ?? Number(this.cache.enableNginx)),
        logRetentionDays: sysConfig.log_retention_days ?? this.cache.logRetentionDays,
        riskKeywords: (sysConfig.risk_keywords ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      };
    } else {
      db.prepare(
        'INSERT OR IGNORE INTO sys_config (id, app_domain, api_domain, admin_domain, enable_nginx, log_retention_days, risk_keywords) VALUES (1, ?, ?, ?, ?, ?, ?)'
      ).run(
        this.cache.appDomain,
        this.cache.apiDomain,
        this.cache.adminDomain,
        this.cache.enableNginx ? 1 : 0,
        this.cache.logRetentionDays,
        this.cache.riskKeywords.join(',')
      );
    }

    const modelSettings = db
      .prepare<ModelSettingsRow>('SELECT * FROM model_settings ORDER BY updated_at DESC LIMIT 1')
      .get();
    if (modelSettings) {
      this.cache = {
        ...this.cache,
        model: {
          provider: modelSettings.provider ?? this.cache.model.provider,
          modelName: modelSettings.model_name ?? this.cache.model.modelName,
          apiBase: modelSettings.api_base ?? this.cache.model.apiBase,
          apiKey: decryptSecret(modelSettings.api_key_encrypted) ?? this.cache.model.apiKey,
          temperature: modelSettings.temperature ?? this.cache.model.temperature,
          maxTokens: modelSettings.max_tokens ?? this.cache.model.maxTokens
        }
      };
    }
  }

  getConfig(): RuntimeConfig {
    return { ...this.cache, model: { ...this.cache.model } };
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
