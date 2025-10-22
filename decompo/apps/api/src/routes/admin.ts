import { FastifyInstance } from "fastify";
import { verifyPassword, hashPassword } from "@decompo/shared-utils";
import { createSessionToken, verifySessionToken } from "../core/admin/auth";
import { AppContext } from "../context";
import { sendError } from "../core/errors/handler";
import { ERROR_CODES } from "../core/errors/codes";

interface AdminRequest extends import("fastify").FastifyRequest {
  contextData?: {
    logId?: number;
    startTime: number;
  };
}

function requireAdmin(request: AdminRequest, reply: import("fastify").FastifyReply) {
  const token = request.cookies?.admin_session;
  const payload = verifySessionToken(token);
  if (!payload) {
    sendError(reply, {
      code: ERROR_CODES.HOST_FORBIDDEN,
      message: "未授权",
      statusCode: 401,
    });
    return false;
  }
  return payload;
}

export function registerAdminRoutes(server: FastifyInstance, ctx: AppContext) {
  server.post("/v1/admin/login", async (request: AdminRequest, reply) => {
    const body = request.body as { password?: string };
    if (!body?.password) {
      return sendError(reply, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "缺少密码",
        statusCode: 400,
      });
    }
    const row = ctx.db.prepare("SELECT password_hash FROM admin_credentials WHERE id = 1").get();
    if (!row) {
      return sendError(reply, {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "系统未初始化",
        statusCode: 500,
      });
    }
    const ok = await verifyPassword(row.password_hash, body.password);
    if (!ok) {
      return sendError(reply, {
        code: ERROR_CODES.HOST_FORBIDDEN,
        message: "密码错误",
        statusCode: 401,
      });
    }
    const token = createSessionToken("admin");
    reply.setCookie("admin_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 3600,
    });
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: { success: true },
      error: null,
    });
  });

  server.post("/v1/admin/logout", async (request, reply) => {
    reply.clearCookie("admin_session", { path: "/" });
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: { success: true },
      error: null,
    });
  });

  server.get("/v1/admin/overview", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const totals = ctx.db.prepare("SELECT COUNT(*) as count FROM request_logs").get();
    const success = ctx.db
      .prepare("SELECT COUNT(*) as count FROM request_logs WHERE status LIKE '2%'")
      .get();
    const avgLatency = ctx.db.prepare("SELECT AVG(latency_ms) as avg FROM request_logs").get();
    const feedback = ctx.db
      .prepare("SELECT rating, COUNT(*) as count FROM feedback GROUP BY rating")
      .all();

    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: {
        requests: totals.count || 0,
        success_rate: totals.count ? (success.count || 0) / totals.count : 0,
        avg_latency: avgLatency.avg || 0,
        feedback,
      },
      error: null,
    });
  });

  server.get("/v1/admin/logs", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const { endpoint, mode, status, limit = 50, offset = 0 } = request.query as any;
    const clauses: string[] = [];
    const params: any = { limit: Number(limit), offset: Number(offset) };
    if (endpoint) {
      clauses.push("endpoint = @endpoint");
      params.endpoint = endpoint;
    }
    if (mode) {
      clauses.push("mode = @mode");
      params.mode = mode;
    }
    if (status) {
      clauses.push("status = @status");
      params.status = status;
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = ctx.db
      .prepare(
        `SELECT id, ts, endpoint, mode, status, latency_ms FROM request_logs ${where} ORDER BY ts DESC LIMIT @limit OFFSET @offset`
      )
      .all(params);
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: rows,
      error: null,
    });
  });

  server.get("/v1/admin/logs/:id", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const id = Number((request.params as any).id);
    const log = ctx.db.prepare("SELECT * FROM request_logs WHERE id = ?").get(id);
    if (!log) {
      return sendError(reply, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "记录不存在",
        statusCode: 404,
      });
    }
    const aiCalls = ctx.db
      .prepare("SELECT * FROM ai_calls WHERE req_id = ?")
      .all(id);
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: { log, ai_calls: aiCalls },
      error: null,
    });
  });

  server.get("/v1/admin/prompts", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const rows = ctx.configRepo.listPrompts();
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: rows,
      error: null,
    });
  });

  server.post("/v1/admin/prompts", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const body = request.body as { name: string; content: string; enabled: boolean };
    if (!body?.name || !body.content) {
      return sendError(reply, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "参数不完整",
        statusCode: 400,
      });
    }
    const versionRow = ctx.db
      .prepare("SELECT COALESCE(MAX(version), 0) + 1 as next FROM prompts WHERE name = ?")
      .get(body.name);
    ctx.db
      .prepare(
        `INSERT INTO prompts (name, version, content, enabled, extra)
         VALUES (@name, @version, @content, @enabled, '{}')`
      )
      .run({
        name: body.name,
        version: versionRow.next,
        content: body.content,
        enabled: body.enabled ? 1 : 0,
      });
    ctx.configRepo.refresh();
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: { success: true },
      error: null,
    });
  });

  server.get("/v1/admin/model", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const model = ctx.configRepo.getModelConfig();
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: model,
      error: null,
    });
  });

  server.post("/v1/admin/model", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const body = request.body as any;
    if (!body?.modelName || !body?.apiBase) {
      return sendError(reply, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "参数不完整",
        statusCode: 400,
      });
    }
    ctx.configRepo.updateModelConfig({
      provider: "qwen",
      modelName: body.modelName,
      apiBase: body.apiBase,
      apiKey: body.apiKey || "",
      temperature: Number(body.temperature ?? 0.6),
      maxTokens: Number(body.maxTokens ?? 256),
    });
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: { success: true },
      error: null,
    });
  });

  server.get("/v1/admin/system", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const sys = ctx.configRepo.getSystemConfig();
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: sys,
      error: null,
    });
  });

  server.post("/v1/admin/system", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const body = request.body as any;
    if (!body?.apiDomain || !body?.adminDomain || !body?.appDomain) {
      return sendError(reply, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "参数不完整",
        statusCode: 400,
      });
    }
    ctx.configRepo.updateSystemConfig({
      appDomain: body.appDomain,
      apiDomain: body.apiDomain,
      adminDomain: body.adminDomain,
      enableNginx: Boolean(body.enableNginx),
      logRetentionDays: Number(body.logRetentionDays ?? 30),
      riskKeywords: Array.isArray(body.riskKeywords)
        ? body.riskKeywords
        : String(body.riskKeywords || "").split(/[,，]/).map((s: string) => s.trim()).filter(Boolean),
    });
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: { success: true },
      error: null,
    });
  });

  server.post("/v1/admin/password", async (request: AdminRequest, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const body = request.body as { newPassword?: string };
    if (!body?.newPassword || body.newPassword.length < 8) {
      return sendError(reply, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "密码至少 8 位",
        statusCode: 400,
      });
    }
    const hash = await hashPassword(body.newPassword);
    ctx.db
      .prepare("UPDATE admin_credentials SET password_hash = @hash, updated_at = CURRENT_TIMESTAMP WHERE id = 1")
      .run({ hash });
    return reply.status(200).send({
      version: 1,
      status: "ok",
      meta: { latency_ms: 0 },
      data: { success: true },
      error: null,
    });
  });
}
