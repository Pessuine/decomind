import { FastifyInstance } from 'fastify';
import { verifyAdmin, requireAdmin } from '../core/auth/admin.js';
import { loadSysConfig, loadModelConfig, decryptApiKey, encryptApiKey, updateCaches } from '../core/config/repo.js';
import { invalidatePrompt } from '../core/prompts/repo.js';
import { db } from '../core/config/database.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.post('/admin/login', async (request, reply) => {
    const { password, totp } = request.body as any;
    if (typeof password !== 'string' || typeof totp !== 'string') {
      return reply.status(400).send({ message: '参数错误' });
    }
    const token = await verifyAdmin(password, totp);
    if (!token) {
      return reply.status(401).send({ message: '认证失败' });
    }
    return reply.send({ token });
  });

  fastify.get('/admin/config', async (request, reply) => {
    const token = request.headers['x-admin-token'] as string | undefined;
    if (!requireAdmin(token)) {
      return reply.status(401).send({ message: '未授权' });
    }
    return reply.send({
      sys: loadSysConfig(),
      model: { ...loadModelConfig(), api_key: decryptApiKey() }
    });
  });

  fastify.put('/admin/config/model', async (request, reply) => {
    const token = request.headers['x-admin-token'] as string | undefined;
    if (!requireAdmin(token)) {
      return reply.status(401).send({ message: '未授权' });
    }
    const body = request.body as any;
    db.prepare(
      `INSERT INTO model_settings (provider, model_name, api_base, api_key_encrypted, temperature, max_tokens, extra)
       VALUES (@provider, @model_name, @api_base, @api_key_encrypted, @temperature, @max_tokens, json(@extra))`
    ).run({
      provider: body.provider || 'qwen',
      model_name: body.model_name,
      api_base: body.api_base,
      api_key_encrypted: body.api_key ? encryptApiKey(body.api_key) : '',
      temperature: Number(body.temperature ?? 0.6),
      max_tokens: Number(body.max_tokens ?? 256),
      extra: JSON.stringify(body.extra || {})
    });
    updateCaches();
    return reply.send({ ok: true });
  });

  fastify.get('/admin/prompts', async (request, reply) => {
    const token = request.headers['x-admin-token'] as string | undefined;
    if (!requireAdmin(token)) {
      return reply.status(401).send({ message: '未授权' });
    }
    const rows = db.prepare('SELECT name, version, enabled FROM prompts ORDER BY name, version DESC').all();
    return reply.send(rows);
  });

  fastify.get('/admin/prompts/:name', async (request, reply) => {
    const token = request.headers['x-admin-token'] as string | undefined;
    if (!requireAdmin(token)) {
      return reply.status(401).send({ message: '未授权' });
    }
    const { name } = request.params as any;
    const row = db.prepare('SELECT name, version, content FROM prompts WHERE name = ? ORDER BY version DESC LIMIT 1').get(name);
    if (!row) return reply.status(404).send({ message: '未找到 Prompt' });
    return reply.send(row);
  });

  fastify.post('/admin/prompts/:name', async (request, reply) => {
    const token = request.headers['x-admin-token'] as string | undefined;
    if (!requireAdmin(token)) {
      return reply.status(401).send({ message: '未授权' });
    }
    const { name } = request.params as any;
    const body = request.body as any;
    const latest = db.prepare('SELECT version FROM prompts WHERE name = ? ORDER BY version DESC LIMIT 1').get(name);
    const version = latest ? latest.version + 1 : 1;
    db.prepare('INSERT INTO prompts (name, version, content, enabled, extra) VALUES (?, ?, ?, 1, json(?))').run(name, version, body.content, JSON.stringify({}));
    invalidatePrompt(name);
    return reply.send({ name, version });
  });

  fastify.get('/admin/logs', async (request, reply) => {
    const token = request.headers['x-admin-token'] as string | undefined;
    if (!requireAdmin(token)) {
      return reply.status(401).send({ message: '未授权' });
    }
    const query = request.query as any;
    let sql = 'SELECT id, ts, endpoint, status, latency_ms FROM request_logs WHERE 1=1';
    const params: any[] = [];
    if (query.endpoint) {
      sql += ' AND endpoint LIKE ?';
      params.push(`%${query.endpoint}%`);
    }
    if (query.status) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    sql += ' ORDER BY id DESC LIMIT 200';
    const rows = db.prepare(sql).all(...params);
    return reply.send(rows);
  });

  fastify.get('/admin/metrics', async (request, reply) => {
    const token = request.headers['x-admin-token'] as string | undefined;
    if (!requireAdmin(token)) {
      return reply.status(401).send({ message: '未授权' });
    }
    const stats = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = "ok" THEN 1 ELSE 0 END) as ok FROM request_logs WHERE ts > datetime("now", "-1 day")').get();
    const avgLatency = db.prepare('SELECT AVG(latency_ms) as latency FROM request_logs WHERE latency_ms IS NOT NULL').get();
    const total = stats?.total || 0;
    const ok = stats?.ok || 0;
    return reply.send({ requests: total, successRate: total ? Math.round((ok / total) * 100) : 0, latency: Math.round(avgLatency?.latency || 0) });
  });

  fastify.put('/admin/config/sys', async (request, reply) => {
    const token = request.headers['x-admin-token'] as string | undefined;
    if (!requireAdmin(token)) {
      return reply.status(401).send({ message: '未授权' });
    }
    const body = request.body as any;
    db.prepare(
      `UPDATE sys_config SET app_domain=@app_domain, api_domain=@api_domain, admin_domain=@admin_domain, enable_nginx=@enable_nginx,
        log_retention_days=@log_retention_days, risk_keywords=@risk_keywords, experience_sampling=@experience_sampling WHERE id = 1`
    ).run({
      app_domain: body.app_domain,
      api_domain: body.api_domain,
      admin_domain: body.admin_domain,
      enable_nginx: body.enable_nginx ? 1 : 0,
      log_retention_days: Number(body.log_retention_days ?? 30),
      risk_keywords: body.risk_keywords || '',
      experience_sampling: body.experience_sampling ? 1 : 0
    });
    updateCaches();
    return reply.send({ ok: true });
  });
}
