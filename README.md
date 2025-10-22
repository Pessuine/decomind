# 分解力（Decomind）

分解力是一个面向行动指导的多端应用，包含移动端 H5、API 网关以及管理后台。本仓库提供 Windows Server 环境的一键部署脚本以及核心服务代码。

## 目录结构

```
decomind/
├─ scripts/                # Windows Server 部署脚本
├─ apps/
│  ├─ api/                 # Fastify API 网关
│  ├─ web-h5/              # H5 前端（Vue 3 + Vite）
│  └─ admin/               # 管理后台（Vue 3 + Naive UI）
├─ packages/
│  ├─ shared-schemas/      # 跨端 JSON Schema 定义
│  └─ shared-utils/        # 公共工具（脱敏、错误码等）
├─ infra/
│  ├─ db/                  # SQLite 初始化脚本与迁移
│  └─ nginx/               # Nginx 模板配置
└─ README.md
```

## 快速开始

```bash
npm install
npm run build
```

开发模式下可以使用：

```bash
npm run dev:api
npm run dev:web
npm run dev:admin
```

## 部署

在 Windows Server 上执行 `scripts/auto-deploy.bat` 会完成以下步骤：

1. 安装 Node.js LTS 与 PM2。
2. 交互式收集域名、端口、Qwen 相关配置并生成 `.env`。
3. 安装依赖、构建前后端产物。
4. 初始化 SQLite 数据库结构。
5. 使用 PM2 启动 API 与管理后台，并注册开机自启。
6. 输出访问地址并自动打开管理后台登录页。

如需启用 Nginx 反向代理，可额外执行 `scripts/setup-nginx.ps1`。
