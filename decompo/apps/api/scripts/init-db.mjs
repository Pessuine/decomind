import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const apiDir = path.join(repoRoot, "apps", "api");
const envPath = path.join(apiDir, ".env");
let dbRelative = "../data/app.db";

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = /^DB_PATH=(.*)$/.exec(line.trim());
    if (match) {
      dbRelative = match[1];
      break;
    }
  }
}

const dbPath = path.resolve(apiDir, dbRelative);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlPath = path.join(repoRoot, "infra", "db", "init.sql");
if (!fs.existsSync(sqlPath)) {
  throw new Error(`SQL 初始化文件不存在: ${sqlPath}`);
}
const sql = fs.readFileSync(sqlPath, "utf8");

const db = new Database(dbPath);
db.exec(sql);
db.close();

console.log(`[InitDB] SQLite 数据库已初始化：${dbPath}`);
