# 分解力（Decompo）

该仓库采用 Monorepo 结构，包含移动端 H5、API 网关、管理后台以及共享工具包。整体目标是提供面向分步骤行动指导的服务，核心依赖通义千问（Qwen）兼容 OpenAI Chat Completions 接口。

## 目录结构

```
decompo/
├─ scripts/               # 部署脚本（Windows Server）
├─ apps/
│  ├─ web-h5/             # H5 前端（Vue 3 + Vite + Tailwind + Pinia）
│  ├─ api/                # API 网关（Node 18+ + Fastify）
│  └─ admin/              # 管理后台（Vue 3 + Naive UI）
├─ packages/
│  ├─ shared-schemas/     # 共享 JSON Schema（zod）
│  └─ shared-utils/       # 共享工具（脱敏、错误码等）
├─ infra/
│  ├─ db/                 # SQLite 初始化与迁移
│  └─ nginx/              # Nginx 配置模板
├─ .gitignore
├─ package.json
└─ README.md
```

## 快速开始

1. 安装 Node.js 18+。
2. 在仓库根目录执行 `npm install` 安装所有工作区依赖。
3. API 服务运行：`npm run dev --workspace apps/api`。
4. 管理后台与 H5 前端可分别执行各自目录下的开发命令。
5. Windows Server 上可通过 `scripts/auto-deploy.bat` 进行一键部署。

详细设计请参考代码注释和脚本中的说明。
