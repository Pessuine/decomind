PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS request_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT,
  ua TEXT,
  endpoint TEXT,
  mode TEXT,
  payload_text TEXT,
  forwarded INTEGER,
  status TEXT,
  latency_ms INTEGER,
  extra JSON
);

CREATE TABLE IF NOT EXISTS ai_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  req_id INTEGER REFERENCES request_logs(id),
  provider TEXT,
  model TEXT,
  prompt_name TEXT,
  prompt_version INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  response_json TEXT,
  extra JSON
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_uuid TEXT,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  mode TEXT,
  rating TEXT,
  note TEXT,
  extra JSON
);

CREATE TABLE IF NOT EXISTS consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  consented INTEGER,
  extra JSON
);

CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  version INTEGER,
  content TEXT,
  enabled INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  extra JSON
);

CREATE TABLE IF NOT EXISTS model_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT,
  model_name TEXT,
  api_base TEXT,
  api_key_encrypted TEXT,
  temperature REAL,
  max_tokens INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  extra JSON
);

CREATE TABLE IF NOT EXISTS sys_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  app_domain TEXT,
  api_domain TEXT,
  admin_domain TEXT,
  enable_nginx INTEGER,
  log_retention_days INTEGER,
  risk_keywords TEXT,
  experience_sampling INTEGER DEFAULT 0,
  extra JSON
);

INSERT INTO sys_config (id, app_domain, api_domain, admin_domain, enable_nginx, log_retention_days, risk_keywords, experience_sampling, extra)
  VALUES (1, 'app.example.com', 'api.example.com', 'another.com', 0, 30, '敏感,危险', 1, json('{}'))
  ON CONFLICT(id) DO NOTHING;

INSERT INTO model_settings (provider, model_name, api_base, api_key_encrypted, temperature, max_tokens, extra)
  SELECT 'qwen', 'qwen-max', 'https://dashscope.aliyuncs.com/compatible-mode/v1', '', 0.6, 256, json('{}')
  WHERE NOT EXISTS (SELECT 1 FROM model_settings);

INSERT INTO prompts (name, version, content, enabled, extra)
  VALUES
    ('action_step', 1, '{"role":"system","content":"你是行动推进器。严格输出 JSON，遵守 schema。"}', 1, json('{}')),
    ('help_simpler', 1, '{"role":"system","content":"根据当前动作提供更简单的下一步。"}', 1, json('{}')),
    ('help_alt', 1, '{"role":"system","content":"提供替代方案，保持原子动作。"}', 1, json('{}')),
    ('help_hint', 1, '{"role":"system","content":"给出一句提示帮助完成动作。"}', 1, json('{}')),
    ('help_split', 1, '{"role":"system","content":"将动作拆分为更小的一步。"}', 1, json('{}')),
    ('guide_outline', 1, '{"role":"system","content":"生成结构化大纲，严格 JSON。"}', 1, json('{}'))
  ON CONFLICT(name, version) DO NOTHING;
