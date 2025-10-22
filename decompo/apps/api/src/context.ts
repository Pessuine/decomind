import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { ConfigRepository } from "./core/config/repo";
import { PromptRepository } from "./core/prompts/repo";
import { LoggingRepository } from "./core/logging/repo";
import { RiskFilter } from "./core/risk/filter";

export interface AppContext {
  db: Database.Database;
  configRepo: ConfigRepository;
  promptRepo: PromptRepository;
  loggingRepo: LoggingRepository;
  riskFilter: RiskFilter;
}

export function createContext(dbPath: string): AppContext {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  if (envHash) {
    db.prepare(
      `INSERT INTO admin_credentials (id, password_hash, extra)
       VALUES (1, @hash, '{}')
       ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, updated_at = CURRENT_TIMESTAMP`
    ).run({ hash: envHash });
  }
  const configRepo = new ConfigRepository(db);
  configRepo.refresh();
  const promptRepo = new PromptRepository(configRepo);
  const loggingRepo = new LoggingRepository(db);
  const riskFilter = new RiskFilter(configRepo.getRiskConfig());

  setInterval(() => {
    configRepo.refresh();
    riskFilter.update(configRepo.getRiskConfig());
  }, 30_000).unref();

  return {
    db,
    configRepo,
    promptRepo,
    loggingRepo,
    riskFilter,
  };
}
