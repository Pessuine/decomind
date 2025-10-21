# 分解力（Decomind）

分解力是一个面向行动分解和任务指导的 AI 助手，采用 Monorepo 管理前端 H5、后台控制台与 API 网关。项目提供 Windows Server 下一键部署脚本，使用通义千问（Qwen）OpenAI 兼容接口完成模型调用。

## 快速开始

1. 准备 Windows Server 2019+，并确保具备互联网访问能力。
2. 下载仓库并双击 `scripts/auto-deploy.bat`。
3. 按提示输入域名、端口、Qwen API Key、后台初始口令等信息。
4. 安装脚本会自动完成依赖安装、数据库初始化、构建前端以及启动服务。
5. 部署完成后，浏览器访问 `https://another.com`，使用初始口令 + TOTP 完成登录，建议立即更改口令并绑定双因素。

更多细节请参考各子目录的文档与源码注释。
