import type Database from "better-sqlite3";

export interface SystemConfig {
  app_domain: string;
  api_domain: string;
  admin_domain: string;
  enable_nginx: boolean;
  log_retention_days: number;
  risk_keywords: string;
}

export function loadSystemConfig(db: Database.Database): SystemConfig {
  const row = db.prepare(`SELECT * FROM sys_config WHERE id = 1`).get();
  if (row) {
    return {
      app_domain: row.app_domain,
      api_domain: row.api_domain,
      admin_domain: row.admin_domain,
      enable_nginx: Boolean(row.enable_nginx),
      log_retention_days: row.log_retention_days ?? 7,
      risk_keywords: row.risk_keywords ?? "",
    };
  }
  return {
    app_domain: process.env.APP_DOMAIN || "app.example.com",
    api_domain: process.env.API_DOMAIN || "api.example.com",
    admin_domain: process.env.ADMIN_DOMAIN || "another.com",
    enable_nginx: false,
    log_retention_days: Number(process.env.LOG_RETENTION_DAYS || 7),
    risk_keywords: process.env.RISK_KEYWORDS || "",
  };
}
