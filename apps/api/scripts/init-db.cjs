#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || '../data/app.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initSqlPath = path.resolve(__dirname, '../../../infra/db/init.sql');
const initSql = fs.readFileSync(initSqlPath, 'utf8');
db.exec(initSql);

const configRow = db.prepare('SELECT id FROM sys_config WHERE id = 1').get();
if (!configRow) {
  db.prepare(
    `INSERT INTO sys_config (id, app_domain, api_domain, admin_domain, enable_nginx, log_retention_days, risk_keywords, extra)
     VALUES (1, ?, ?, ?, 0, 30, ?, json(?))`,
  ).run(
    process.env.APP_DOMAIN,
    process.env.API_DOMAIN,
    process.env.ADMIN_DOMAIN,
    '违法,自杀,爆炸',
    JSON.stringify({}),
  );
}

function encryptSecret(value) {
  const crypto = require('crypto');
  const secret = process.env.CONFIG_SECRET || process.env.ADMIN_PASSWORD_HASH;
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${enc.toString('base64')}.${tag.toString('base64')}`;
}

const existingModel = db.prepare('SELECT id FROM model_settings ORDER BY updated_at DESC LIMIT 1').get();
if (!existingModel) {
  db.prepare(
    `INSERT INTO model_settings (provider, model_name, api_base, api_key_encrypted, temperature, max_tokens, extra)
     VALUES (?, ?, ?, ?, ?, ?, json(?))`,
  ).run(
    'qwen',
    process.env.MODEL_NAME || 'qwen-max',
    process.env.QWEN_BASE_URL,
    encryptSecret(requireEnv('QWEN_API_KEY')),
    Number(process.env.TEMPERATURE || 0.6),
    Number(process.env.MAX_TOKENS || 256),
    JSON.stringify({}),
  );
}

const prompts = [
  {
    name: 'action_step',
    version: 1,
    content: `你是“行动推进器”。严格遵守以下要求：\n- 必须仅输出 JSON。\n- 输出 schema: {"step":{"type":"action","text":""},"progress":{...可选},"menu":[]可选}\n- "text" 为一个可以立即执行的原子动作，动词开头，不要礼貌或说明性前缀。\n- 不要输出多余说明。`,
  },
  {
    name: 'help_simpler',
    version: 1,
    content: `你提供更简单的下一步动作。仅输出 JSON，结构与行动步骤一致。`,
  },
  {
    name: 'help_alt',
    version: 1,
    content: `用户想换个做法，请产出另一条可执行的原子动作指令。仅输出 JSON。`,
  },
  {
    name: 'help_hint',
    version: 1,
    content: `用户需要提示。输出 schema {"step":{"type":"action","text":""}}，给出简短提示或提醒。`,
  },
  {
    name: 'help_split',
    version: 1,
    content: `用户觉得这步太难，请把当前动作拆成更小的一步。仅输出 JSON。`,
  },
  {
    name: 'guide_outline',
    version: 1,
    content: `你是行动规划师。仅输出 JSON schema {"outline":[{"title":"","steps":[]}]}. 给出主题的执行大纲。`,
  },
];

for (const prompt of prompts) {
  const exists = db
    .prepare('SELECT id FROM prompts WHERE name = ? AND version = ?')
    .get(prompt.name, prompt.version);
  if (!exists) {
    db.prepare(
      `INSERT INTO prompts (name, version, content, enabled, extra) VALUES (?, ?, ?, 1, json(?))`,
    ).run(prompt.name, prompt.version, prompt.content, JSON.stringify({}));
  }
}

console.log('[db] initialisation complete');
