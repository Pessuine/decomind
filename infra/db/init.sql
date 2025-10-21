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
  extra JSON
);
