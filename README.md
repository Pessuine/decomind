# 事情分解工具（拖延症专用行动引导助手）

本项目为 Windows 友好部署的轻量任务拆解与行动引导工具，包括 Python Flask 后端与 React + Vite 前端。后端调用通义千问 `qwen-flash`（兼容 OpenAI 接口），并在模型不可用时自动启用本地规则拆解。前端只在浏览器本地缓存计划数据，无服务端持久化。

## 功能概览

- 自由输入或模板输入任务描述，AI 生成符合 Schema 的任务树 + 行动计划 JSON。
- 前端以清单视图呈现，可拖拽排序、内联编辑、勾选进度。
- 行动引导模式提供倒计时番茄钟、逐步提示、阻碍提醒。
- AI 重写接口，可基于提示重新压缩或调整计划。
- 本地缓存（`localStorage`）自动保存，支持导入导出 JSON。
- 自动化部署脚本 `scripts/auto_setup.py`，一键创建虚拟环境并安装前后端依赖。

## 快速开始

1. 运行自动化脚本：

   ```powershell
   python scripts/auto_setup.py
   ```

   按提示选择模型提供商并填写 API Key。

2. 启动后端（示例）：

   ```powershell
   backend\.venv\Scripts\python.exe -m waitress --listen=0.0.0.0:8000 backend.app:app
   ```

3. 启动前端：

   ```bash
   cd frontend
   npm run dev
   ```

4. 浏览器访问 `http://localhost:5173` 体验工具。

## 目录结构

- `backend/` Flask 应用、LLM 适配、Schema 校验、规则回退。
- `frontend/` React + Vite 单页应用（任务输入、清单、行动模式）。
- `scripts/auto_setup.py` 部署助手。

## 配置

通过环境变量或 `.env` 控制模型选择与接口地址：

- `PROVIDER=QWEN|OPENAI`
- `QWEN_API_KEY`、`QWEN_BASE_URL`
- `OPENAI_API_KEY`、`OPENAI_BASE_URL`
- `ALLOWED_ORIGINS`（逗号分隔）
- `REQUEST_LIMIT_PER_MIN`

## 测试

- 后端：`python -m compileall backend`
- 前端：`npm run build`（需先 `npm install`）

