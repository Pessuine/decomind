import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type AppDatabase = Database.Database;

function ensureDirectory(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function initDatabase(): AppDatabase {
  const defaultPath = path.resolve(process.cwd(), "data/app.db");
  const dbPath = process.env.DB_PATH ? path.resolve(process.cwd(), process.env.DB_PATH) : defaultPath;
  ensureDirectory(dbPath);
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}
