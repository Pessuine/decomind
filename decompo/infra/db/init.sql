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

CREATE TABLE IF NOT EXISTS admin_credentials (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  extra JSON
);

INSERT INTO sys_config (id, app_domain, api_domain, admin_domain, enable_nginx, log_retention_days, risk_keywords, extra)
VALUES (1, 'app.example.com', 'api.example.com', 'another.com', 0, 30, '诈骗,暴力', '{}')
ON CONFLICT(id) DO NOTHING;

INSERT INTO admin_credentials (id, password_hash, extra)
VALUES (1, '$argon2id$v=19$m=65536,t=3,p=4$7N3T4ZIJZG+YJ3RDC6p8zg$QOXQ8+qSgy5bE6vkoRaSPJtBpp1r+ngTfGsDzpDHK3E', '{}')
ON CONFLICT(id) DO NOTHING;

INSERT INTO prompts (name, version, content, enabled, extra)
VALUES
  ('action_step', 1, '{"step":{"type":"action","text":"走到浴室"},"progress":{"current":1,"total":5,"percent":20}}', 1, '{}'),
  ('help_simpler', 1, '{"step":{"type":"action","text":"先穿拖鞋"}}', 1, '{}'),
  ('help_alt', 1, '{"step":{"type":"action","text":"准备毛巾"}}', 1, '{}'),
  ('help_hint', 1, '{"step":{"type":"action","text":"检查水温"}}', 1, '{}'),
  ('help_split', 1, '{"step":{"type":"action","text":"打开浴室门"}}', 1, '{}'),
  ('guide_outline', 1, '{"outline":[{"title":"准备","steps":["确认培养基批号","准备器材"]},{"title":"操作","steps":["接种","培养","观察记录"]}]}', 1, '{}')
ON CONFLICT(name, version) DO NOTHING;

INSERT INTO model_settings (provider, model_name, api_base, api_key_encrypted, temperature, max_tokens, extra)
VALUES ('qwen', 'qwen-max', 'https://dashscope.aliyuncs.com/compatible-mode/v1', '', 0.6, 256, '{}')
ON CONFLICT DO NOTHING;
