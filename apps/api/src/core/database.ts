import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const configured = process.env.DB_PATH ?? path.join('data', 'app.db');
const dbPath = path.isAbsolute(configured)
  ? configured
  : path.resolve(process.cwd(), configured);

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

type Migration = {
  name: string;
  sql: string;
};

const migrations: Migration[] = [];

export function registerMigration(name: string, sql: string) {
  migrations.push({ name, sql });
}

function ensureMigrationsTable() {
  const exists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'")
    .get();
  if (!exists) {
    db.prepare(
      'CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP)'
    ).run();
  }
}

export function runMigrations() {
  ensureMigrationsTable();
  const applied = new Set(
    db.prepare('SELECT name FROM migrations').all().map((row: { name: string }) => row.name)
  );

  const transaction = db.transaction((tasks: Migration[]) => {
    for (const task of tasks) {
      if (applied.has(task.name)) {
        continue;
      }
      db.exec(task.sql);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(task.name);
    }
  });

  transaction(migrations);
}

// Load bootstrap SQL from infra/db/init.sql if present
const bootstrapSqlPath = path.resolve(process.cwd(), 'infra', 'db', 'init.sql');
if (fs.existsSync(bootstrapSqlPath)) {
  registerMigration('000_init.sql', fs.readFileSync(bootstrapSqlPath, 'utf-8'));
}
