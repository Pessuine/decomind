import type Database from "better-sqlite3";
import { EnvConfig } from "../../types/config";

interface ModelSettings {
  provider: string;
  model_name: string;
  api_base: string | null;
  api_key_encrypted: string | null;
  temperature: number | null;
  max_tokens: number | null;
}

export interface ConfigRepo {
  getAllowedHosts(): string[];
  getModelSettings(): ModelSettings;
  getSampleLoggingEnabled(): boolean;
  getEnvConfig(): EnvConfig;
}

export function createConfigRepo(db: Database.Database, env: EnvConfig): ConfigRepo {
  let cachedAllowedHosts: string[] | null = null;
  let cachedModelSettings: ModelSettings | null = null;

  function loadAllowedHosts(): string[] {
    const sysRow = db.prepare("SELECT app_domain, api_domain, admin_domain FROM sys_config WHERE id = 1").get();
    const hosts = new Set<string>();
    if (env.API_DOMAIN) hosts.add(env.API_DOMAIN);
    if (env.ADMIN_DOMAIN) hosts.add(env.ADMIN_DOMAIN);
    if (env.APP_DOMAIN) hosts.add(env.APP_DOMAIN);
    if (sysRow) {
      for (const value of Object.values(sysRow)) {
        if (typeof value === "string" && value) {
          hosts.add(value);
        }
      }
    }
    hosts.add("localhost");
    return Array.from(hosts);
  }

  function loadModelSettings(): ModelSettings {
    const row = db
      .prepare(
        "SELECT provider, model_name, api_base, api_key_encrypted, temperature, max_tokens FROM model_settings ORDER BY updated_at DESC LIMIT 1"
      )
      .get();
    return {
      provider: row?.provider ?? "qwen",
      model_name: row?.model_name ?? "qwen-max",
      api_base: row?.api_base ?? env.QWEN_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
      api_key_encrypted: row?.api_key_encrypted ?? env.QWEN_API_KEY ?? null,
      temperature: row?.temperature ?? (env.TEMPERATURE ? Number(env.TEMPERATURE) : null),
      max_tokens: row?.max_tokens ?? (env.MAX_TOKENS ? Number(env.MAX_TOKENS) : null)
    };
  }

  return {
    getAllowedHosts() {
      if (!cachedAllowedHosts) {
        cachedAllowedHosts = loadAllowedHosts();
      }
      return cachedAllowedHosts;
    },
    getModelSettings() {
      if (!cachedModelSettings) {
        cachedModelSettings = loadModelSettings();
      }
      return cachedModelSettings;
    },
    getSampleLoggingEnabled() {
      return env.LOG_SAMPLE_ENABLED === "true";
    },
    getEnvConfig() {
      return env;
    }
  };
}
