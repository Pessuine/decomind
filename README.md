# 分解力（Decomind）

分解力是一个面向执行困难用户的行动分解助手，采用 Monorepo 结构，包含 H5 客户端、API 网关、后台控制台以及共享工具包。

## 快速部署（Windows Server）

1. 下载并解压发布包。
2. 双击 `scripts/auto-deploy.bat`，按照提示填写域名、端口、模型密钥等信息。
3. 完成后在浏览器访问 `https://app.example.com` 与后台 `https://another.com`。

首登后台时使用部署过程中设置的初始密码，并扫描命令行生成的 TOTP 二维码完成绑定。

## 目录结构

```
.
├─ scripts/               # 自动化部署与环境准备脚本
├─ apps/
│  ├─ web-h5/             # 面向用户的 H5 客户端（Vue 3 + Vite + Tailwind）
│  ├─ api/                # API 网关（Fastify + SQLite）
│  └─ admin/              # 后台控制台（Vue 3 + Naive UI）
├─ packages/
│  ├─ shared-schemas/     # JSON Schema（Zod）
│  └─ shared-utils/       # 共享工具
├─ infra/
│  ├─ db/                 # 数据库初始化与迁移
│  └─ nginx/              # Nginx 模板（可选使用）
├─ .editorconfig
├─ README.md
└─ LICENSE
```

## 开发说明

- Monorepo 使用 NPM workspaces 管理依赖。
- API 运行时配置从 SQLite 配置中心读取，并支持后台热更新。
- 所有 AI 输出必须是符合约束的 JSON；解析失败直接返回错误。
- 每个到 API 的请求都会落表 `request_logs` 做备案。

## 运行命令

在仓库根目录执行：

```bash
npm install
npm run build
npm run dev:api
npm run dev:web
npm run dev:admin
```

更多细节请参考各子目录的 README。
