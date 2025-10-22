import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AppDatabase } from "./database";

type SystemConfig = {
  app_domain: string;
  api_domain: string;
  admin_domain: string;
  enable_nginx: number;
  log_retention_days: number;
  risk_keywords: string | null;
};

let cachedConfig: SystemConfig | null = null;
let lastLoadedAt = 0;

const CONFIG_TTL_MS = 60_000;

export function loadSystemConfig(db: AppDatabase): SystemConfig {
  const now = Date.now();
  if (cachedConfig && now - lastLoadedAt < CONFIG_TTL_MS) {
    return cachedConfig;
  }

  const row = db.prepare<SystemConfig>(
    "SELECT app_domain, api_domain, admin_domain, enable_nginx, log_retention_days, risk_keywords FROM sys_config WHERE id = 1"
  ).get();

  if (row) {
    cachedConfig = row;
    lastLoadedAt = now;
    return row;
  }

  const envConfig: SystemConfig = {
    app_domain: process.env.APP_DOMAIN || "app.example.com",
    api_domain: process.env.API_DOMAIN || "api.example.com",
    admin_domain: process.env.ADMIN_DOMAIN || "another.com",
    enable_nginx: Number(process.env.ENABLE_NGINX || 0),
    log_retention_days: Number(process.env.LOG_RETENTION_DAYS || 30),
    risk_keywords: process.env.RISK_KEYWORDS || null
  };

  db.prepare(
    `INSERT OR REPLACE INTO sys_config (id, app_domain, api_domain, admin_domain, enable_nginx, log_retention_days, risk_keywords)
     VALUES (1, @app_domain, @api_domain, @admin_domain, @enable_nginx, @log_retention_days, @risk_keywords)`
  ).run(envConfig);

  cachedConfig = envConfig;
  lastLoadedAt = now;
  return envConfig;
}

export function loadInitSql(): string {
  const baseDir = path.dirname(fileURLToPath(import.meta.url));
  const sqlPath = path.resolve(baseDir, "../../../../../infra/db/init.sql");
  return readFileSync(sqlPath, "utf-8");
}
