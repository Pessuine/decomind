const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const Database = require('better-sqlite3');

const envPath = path.resolve(__dirname, '..', 'apps', 'api', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

const configured = process.env.DB_PATH || path.join('data', 'app.db');
const dbPath = path.isAbsolute(configured)
  ? configured
  : path.resolve(process.cwd(), configured);

const sqlPath = path.resolve(__dirname, '..', 'infra', 'db', 'init.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('init.sql not found at', sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf-8');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.exec(sql);
db.close();

console.log(`SQLite database initialized at ${dbPath}`);
