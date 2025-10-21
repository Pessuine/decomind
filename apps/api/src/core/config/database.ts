import Database from 'better-sqlite3';
import { resolve, dirname, isAbsolute } from 'path';
import { existsSync, mkdirSync } from 'fs';

const rawPath = process.env.DB_PATH || 'data/app.db';
const dbPath = isAbsolute(rawPath) ? rawPath : resolve(process.cwd(), rawPath);
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

type StatementCache = {
  getRequestLog?: ReturnType<typeof db.prepare>;
};

const cache: StatementCache = {};

export { db, cache };
