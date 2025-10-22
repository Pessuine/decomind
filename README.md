# 分解力（Decomind）

分解力是一套用于引导用户将复杂任务拆解为可执行步骤的多端应用。该仓库采用 Monorepo 结构，涵盖移动端 H5、API 网关与管理后台，并提供一键部署脚本以便在 Windows Server 环境快速上线。

## 仓库结构

```
decomind/
├─ scripts/              # Windows Server 部署与依赖安装脚本
├─ apps/
│  ├─ web-h5/            # Vue 3 + Vite 移动端
│  ├─ api/               # Fastify API 网关
│  └─ admin/             # Naive UI 管理后台
├─ packages/
│  ├─ shared-schemas/    # Zod/AJV JSON Schema 包
│  └─ shared-utils/      # 公共工具库
├─ infra/                # 数据库与 Nginx 配置
│  ├─ db/
│  │  └─ init.sql
│  └─ nginx/
│     ├─ nginx.conf.template
│     └─ sites/
│        ├─ api.example.com.conf
│        └─ another.com.conf
└─ README.md
```

## 一键部署

参考 [`scripts/auto-deploy.bat`](scripts/auto-deploy.bat)。该脚本按以下顺序执行：

1. 安装 Node.js LTS 与 PM2。
2. 生成 `.env` 配置。
3. 安装依赖与构建前端。
4. 初始化 SQLite 数据库。
5. 使用 PM2 启动 API 与管理后台，保存进程列表并注册开机自启。
6. 可选：安装并配置 Nginx 反向代理。

## 运行要求

- Node.js 18+
- PM2
- SQLite3
- Windows Server（部署环境）

## 开源许可

本项目遵循 [MIT License](LICENSE)。
