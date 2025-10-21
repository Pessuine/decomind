import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ENV } from './env';

const dbPath = path.isAbsolute(ENV.DB_PATH)
  ? ENV.DB_PATH
  : path.resolve(__dirname, '../', ENV.DB_PATH);
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
