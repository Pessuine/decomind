# 分解力（Decompo）

分解力是一个面向移动端的任务拆解与执行辅助系统，包含用户端 H5 应用、后端 API 服务、运营管理后台以及一键部署脚本。系统内置通义千问兼容的模型接入、审计日志、风控配置等生产级能力。

## 功能总览

- **用户端 H5**：支持“做起来模式”与“怎么做模式”，逐步生成原子行动或结构化指导。
- **困难求助**：在执行过程中提供更简单/换个做法/提示/拆小一点四种智能应对策略。
- **API 服务层**：`/v1/execute`、`/v1/help`、`/v1/skip`、`/v1/guide`、`/v1/consent`、`/v1/feedback`、`/healthz` 全量实现，严格返回 JSON。
- **运营后台**：单密码登录，提供仪表盘、请求日志、模型调用、提示词管理、模型配置、系统设置等模块，保存后即刻生效。
- **审计与风控**：Host 校验、速率限制、数据库审计日志、模型调用留痕、密钥加密存储。
- **部署脚本**：`deploy/deploy.bat` 支持 Windows Server 一键部署、环境配置、依赖安装、数据库初始化和服务启动。

## 目录结构

```
apps/
  api/           # Express + Prisma API 服务
  web/           # React 移动优先 H5 应用
  admin/         # React 管理后台
packages/
  config/        # 环境配置 & 加密工具
  database/      # Prisma Client、Schema、Seed
  shared/        # 前后端共享类型
deploy/
  deploy.bat     # Windows 部署脚本
```

## 快速开始

1. 安装依赖并生成 Prisma Client：
   ```bash
   npm install
   npm run db:generate
   ```
2. 根据 `.env.example` 创建 `.env`，并配置以下关键项：
   - `DATABASE_URL`：PostgreSQL 连接串。
   - `ADMIN_PASSWORD_HASH`：管理员密码的 bcrypt 哈希，使用 `node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 12))"` 生成。
   - `JWT_SECRET`、`CONFIG_ENCRYPTION_KEY`：分别用于后台登录和模型密钥加解密。
   - `ALLOWED_HOSTS`：逗号分隔的域名白名单。
   - `QWEN_ENABLE_MOCK=false` 时将调用真实通义千问 API。
3. 初始化数据库并导入默认配置：
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. 本地开发：
   ```bash
   npm run dev:api     # 启动 API（默认端口 3000）
   npm run dev:web     # 启动 H5（Vite 4173）
   npm run dev:admin   # 启动后台（Vite 4174）
   ```
   开发环境下可在 `.env` 将 `QWEN_ENABLE_MOCK=true`，以模拟模型返回。
5. 构建产物：
   ```bash
   npm run build
   ```
   构建后 API 会在 `/app`、`/console` 下托管前端静态资源。
6. 生产启动：
   ```bash
   npm run start:prod
   ```

## 数据库结构

使用 Prisma + PostgreSQL，核心表包括：

- `request_logs`：API 请求审计日志。
- `ai_calls`：模型请求与响应（结合用户 consent）。
- `prompts`/`prompt_versions`：提示词版本化管理。
- `model_settings`：通义千问兼容配置，API Key 采用 AES-256-GCM 加密存储。
- `sys_config`：域名白名单、速率限制等系统级配置。
- `feedback`、`consent`：用户反馈与数据使用许可。

## 安全设计

- **Host 校验**：拒绝非白名单域名访问。
- **速率限制**：可在后台配置每分钟请求上限。
- **错误处理**：统一返回 JSON，不泄露堆栈信息。
- **日志审计**：所有请求与模型调用均持久化。
- **密钥管理**：后台保存模型配置时自动加密 API Key。

## 部署脚本（Windows Server）

`deploy/deploy.bat` 实现以下流程：

1. 检查 Node.js、npm、psql 是否可用。
2. 复制 `.env.example` 为 `.env`，如已存在则跳过。
3. 安装依赖、生成 Prisma Client、执行数据库迁移与种子脚本。
4. 构建所有前后端产物。
5. 启动 API 服务（同时托管前端静态资源）。
6. 可选安装并配置 Nginx（脚本中提供交互开关）。

部署后可通过 `http(s)://<域名>/app` 访问用户端，`http(s)://<域名>/console` 访问后台。

## 代码规范

- 全量 TypeScript，实现 ESLint + Prettier 统一风格。
- 严格类型定义，避免 `any` 滥用。
- 模块化目录拆分（controllers、services、repositories、middleware、utils）。
- 前端采用移动优先设计，关键交互均提供清晰提示。

## 常见运维操作

- **更新提示词**：登录后台 → 提示词管理，编辑后保存即刻生效。
- **调整模型参数**：后台模型配置可修改温度、Base URL、API Key（保存时自动加密）。
- **修改白名单**：后台系统设置可更新 `allowed_hosts`，无需重启。
- **查看审计**：后台日志审计页面提供请求与模型调用明细。

## 许可协议

本项目依据仓库根目录的 `LICENSE` 文件发布。
