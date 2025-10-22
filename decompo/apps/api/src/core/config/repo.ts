import Database from "better-sqlite3";
import { decrypt, encrypt } from "./keys";
import { RiskConfig, defaultRiskConfig } from "../risk/config";

export interface SystemConfig {
  appDomain: string;
  apiDomain: string;
  adminDomain: string;
  enableNginx: boolean;
  logRetentionDays: number;
  riskKeywords: string[];
}

export interface ModelConfig {
  provider: string;
  modelName: string;
  apiBase: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

export interface PromptRecord {
  name: string;
  version: number;
  content: string;
  enabled: boolean;
}

export class ConfigRepository {
  private sysConfig: SystemConfig | null = null;
  private modelConfig: ModelConfig | null = null;
  private prompts: PromptRecord[] = [];
  private riskConfig: RiskConfig = defaultRiskConfig;

  constructor(private db: Database.Database) {}

  refresh() {
    const sysRow = this.db.prepare("SELECT * FROM sys_config WHERE id = 1").get();
    if (sysRow) {
      this.sysConfig = {
        appDomain: sysRow.app_domain,
        apiDomain: sysRow.api_domain,
        adminDomain: sysRow.admin_domain,
        enableNginx: Boolean(sysRow.enable_nginx),
        logRetentionDays: sysRow.log_retention_days ?? 30,
        riskKeywords: (sysRow.risk_keywords || "").split(/[,，]/).map((s: string) => s.trim()).filter(Boolean),
      };
      this.riskConfig = {
        ...defaultRiskConfig,
        keywords: this.sysConfig.riskKeywords.length ? this.sysConfig.riskKeywords : defaultRiskConfig.keywords,
      };
    }

    const modelRow = this.db
      .prepare("SELECT * FROM model_settings ORDER BY updated_at DESC LIMIT 1")
      .get();
    if (modelRow) {
      this.modelConfig = {
        provider: modelRow.provider,
        modelName: modelRow.model_name,
        apiBase: modelRow.api_base,
        apiKey: decrypt(modelRow.api_key_encrypted || ""),
        temperature: Number(modelRow.temperature ?? 0.6),
        maxTokens: Number(modelRow.max_tokens ?? 256),
      };
    }

    const rows = this.db.prepare("SELECT name, version, content, enabled FROM prompts WHERE enabled = 1").all();
    this.prompts = rows.map((r: any) => ({
      name: r.name,
      version: r.version,
      content: r.content,
      enabled: Boolean(r.enabled),
    }));
  }

  getSystemConfig() {
    return this.sysConfig;
  }

  getModelConfig() {
    return this.modelConfig;
  }

  getRiskConfig() {
    return this.riskConfig;
  }

  getPrompt(name: string) {
    return this.prompts.find((p) => p.name === name);
  }

  listPrompts() {
    return this.prompts;
  }

  updateModelConfig(config: ModelConfig) {
    const encryptedKey = encrypt(config.apiKey);
    this.db
      .prepare(
        `INSERT INTO model_settings (provider, model_name, api_base, api_key_encrypted, temperature, max_tokens, extra)
         VALUES (@provider, @modelName, @apiBase, @apiKeyEncrypted, @temperature, @maxTokens, '{}')`
      )
      .run({
        provider: config.provider,
        modelName: config.modelName,
        apiBase: config.apiBase,
        apiKeyEncrypted: encryptedKey,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    this.refresh();
  }

  updateSystemConfig(cfg: SystemConfig) {
    this.db
      .prepare(
        `REPLACE INTO sys_config (id, app_domain, api_domain, admin_domain, enable_nginx, log_retention_days, risk_keywords, extra)
         VALUES (1, @appDomain, @apiDomain, @adminDomain, @enableNginx, @logRetentionDays, @riskKeywords, '{}')`
      )
      .run({
        appDomain: cfg.appDomain,
        apiDomain: cfg.apiDomain,
        adminDomain: cfg.adminDomain,
        enableNginx: cfg.enableNginx ? 1 : 0,
        logRetentionDays: cfg.logRetentionDays,
        riskKeywords: cfg.riskKeywords.join(","),
      });
    this.refresh();
  }
}
