# Decompo Platform

> Windows-first automation suite for decomposing tasks with Qwen-powered guidance.

## 一键部署

1. 下载仓库后，确保在 **Windows Server** 上。
2. 双击 `scripts/auto-deploy.bat`。
3. 依照提示填写域名、端口、Qwen 接口信息与初始后台密码。
4. 等待脚本依次安装 Node.js LTS、PM2、生成 `.env`、安装依赖、构建前端、初始化数据库并通过 PM2 启动服务。
5. 脚本结束后会自动打开管理后台登录页 `https://another.com`。

> 若脚本任一阶段失败，可根据输出提示重新运行对应步骤或再次执行 `auto-deploy.bat`。

## 首次登录与密码修改

1. 使用初始化脚本中设置的密码登录后台。
2. 登录成功后立即前往“系统安全” → “修改密码”。
3. 输入旧密码与新密码后保存，系统会立即使用 Argon2 重新哈希并热更新。

## 目录结构

```
decompo/
├─ apps/
│  ├─ api/         # Fastify API 服务
│  ├─ admin/       # Vue3 + Naive UI 管理后台
│  └─ web-h5/      # Vue3 + Tailwind H5 端
├─ packages/
│  ├─ shared-schemas/
│  └─ shared-utils/
├─ infra/
│  ├─ db/
│  │  ├─ init.sql
│  │  └─ migrations/
│  └─ nginx/
├─ scripts/
├─ .editorconfig
├─ README.md
└─ LICENSE
```

## 环境变量

部署脚本会生成以下最小 `.env`：

`apps/api/.env`
```ini
NODE_ENV=production
PORT=8080
APP_DOMAIN=app.example.com
API_DOMAIN=api.example.com
ADMIN_DOMAIN=another.com
ALLOW_LOCALHOST=true
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_API_KEY=REPLACE_ME
MODEL_NAME=qwen-max
TEMPERATURE=0.6
MAX_TOKENS=256
DB_PATH=../data/app.db
ADMIN_PASSWORD_HASH=<argon2 hash>
```

`apps/admin/.env`
```ini
VITE_API_BASE=https://api.example.com
VITE_APP_DOMAIN=https://app.example.com
VITE_ADMIN_DOMAIN=https://another.com
```

> 运行时大部分配置由数据库驱动，后台更新后实时生效。

## 域名与端口

- `app.example.com` → H5 前端（默认 4173 / 构建后静态托管）
- `api.example.com` → API 服务（默认 8080）
- `another.com` → 管理后台（默认 4174 预览端口）

确保 DNS 指向服务器公网 IP，且启用 HTTPS。

## 可选 Nginx

若在部署脚本中选择安装 Nginx，将自动：

1. 下载官方 Windows 版本并注册为系统服务。
2. 应用 `infra/nginx/nginx.conf.template` 及站点模板。
3. 配置 HSTS、速率限制、防扫、反向代理至 API / Admin 端口。

部署完成后可执行：

```powershell
nssm status nginx
curl -I https://api.example.com/healthz
```

验证服务可用。

## 默认 Prompt 与配置

数据库初始化脚本已导入示例 Prompt。部署后即可直接通过 `/v1/execute` 获得结构化原子动作指令。

## 运行与构建

- `npm install` & `npm run build` 于各子项目。
- API 项目构建后产物位于 `apps/api/dist`。
- 前端项目构建产物位于 `apps/web-h5/dist` 与 `apps/admin/dist`。

## 许可证

本项目采用 MIT License，详见 `LICENSE`。

