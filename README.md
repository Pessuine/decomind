# 事情分解工具（拖延症专用行动引导助手）

本仓库包含用于部署在 Windows 服务器上的行动引导型任务拆解工具，后端使用 Python + Flask，前端使用 React + Vite。

## 目录结构

- `backend/`：Flask 应用，提供 `/api/decompose`、`/api/rewrite` 等接口，并封装通义千问与 OpenAI 兼容的调用适配层。
- `frontend/`：React 单页应用，负责输入任务、展示计划、行动引导与本地缓存。
- `README.md`：项目说明（当前文件）。
- `LICENSE`：开源许可。

## 快速开始

### 后端

1. 在 Windows 服务器上安装 Python 3.10+，并创建虚拟环境：

   ```powershell
   py -3.10 -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

2. 安装依赖：

   ```powershell
   pip install -r backend/requirements.txt
   ```

3. 配置环境变量（示例为通义千问）：

   ```powershell
   setx PROVIDER QWEN
   setx QWEN_API_KEY <your-key>
   setx QWEN_BASE_URL https://dashscope.aliyuncs.com/compatible-mode/v1
   ```

   若切换 OpenAI 兼容模型，将 `PROVIDER` 改为 `OPENAI`，并设置 `OPENAI_API_KEY`、`OPENAI_BASE_URL`（可为空，默认 `https://api.openai.com/v1`）。

4. 启动后端服务（开发模式）：

   ```powershell
   python -m backend.app
   ```

   生产部署推荐使用 `waitress`：

   ```powershell
   waitress-serve --listen=0.0.0.0:8000 backend.app:app
   ```

### 前端

1. 安装 Node.js 18+。
2. 进入前端目录并安装依赖：

   ```powershell
   cd frontend
   npm install
   ```

3. 启动开发服务器：

   ```powershell
   npm run dev
   ```

   Vite 已配置代理到本地 `http://localhost:8000`。

4. 构建生产包：

   ```powershell
   npm run build
   ```

   构建结果位于 `frontend/dist`，可交由任意静态服务器或反向代理发布。

## 核心特性

- **任务分解 API**：封装通义千问 `qwen-flash` 与 OpenAI 兼容接口，强制返回符合 JSON Schema 的计划。
- **本地缓存**：计划与进度使用 `localStorage` 持久化，支持导入/导出 JSON。
- **行动引导模式**：番茄钟式倒计时、步骤引导、快速重置与完成按钮。
- **降级兜底**：LLM 失败或触发速率限制时自动切换至规则化拆解。
- **安全措施**：基础速率限制、敏感信息检测、上游健康检查。

## 部署建议

- 使用 `waitress` + IIS/NGINX 反向代理，实现 HTTPS 与进程守护。
- 可通过 NSSM 将后端注册为 Windows 服务，确保重启自动恢复。
- 生产环境建议将 `.env` 或系统变量写入安全存储，并定期轮换 API Key。

## 开发提示

- 后端 JSON Schema 定义位于 `backend/schemas.py`，可根据前端需要调整。
- 前端状态管理使用 Zustand，详见 `frontend/src/hooks/useLocalCache.ts` 与 `usePlanState.ts`。
- 计划树支持拖拽排序，若需扩展多层结构或拖拽步骤，可在 `PlanPanel.tsx` 中扩展对应逻辑。

