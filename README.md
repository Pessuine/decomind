# 事情分解工具（拖延症专用行动引导助手）

本项目提供一个前后端一体的“事情分解工具”，帮助用户将短期任务拆解为可执行步骤，并结合行动引导模式辅助执行。

## 项目结构

```
backend/   # Flask API，用于调用通义千问/ OpenAI 兼容接口并提供兜底规则
frontend/  # React + Vite 单页应用，呈现任务计划、可勾选清单与行动引导
```

## 快速开始

### 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows 使用 .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # 按需填写密钥
flask --app backend.app run
```

生产环境建议使用 `waitress` + 反向代理，并通过环境变量切换 `PROVIDER`。

### 前端

```bash
cd frontend
npm install
npm run dev
```

默认开发端口为 `5173`，已配置代理至 `http://localhost:5000/api`。

## 主要功能

- 支持自由输入与模板填空生成任务计划
- LLM 生成失败时自动回退到本地规则分解
- 前端展示任务树、内联编辑、拖拽排序与勾选进度
- 行动引导模式含倒计时、阻塞提示与快捷操作
- 全部数据存储在浏览器本地缓存，可导入导出 JSON

## 安全说明

后端不会持久化任何用户输入，仅做实时转发与校验。请在部署时开启 HTTPS，并配置允许的前端域名。
