import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export interface DbContext {
  db: Database.Database;
}

export function openDatabase(): Database.Database {
  const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), "../data/app.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

export function ensureSchema(db: Database.Database) {
  const initPath = path.resolve(process.cwd(), "../../infra/db/init.sql");
  if (fs.existsSync(initPath)) {
    const sql = fs.readFileSync(initPath, "utf-8");
    db.exec(sql);
  }
}
