import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export function createDb(dbPath: string): Database.Database {
  const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(absolutePath);
  db.pragma("journal_mode = WAL");
  return db;
}
