@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

cd /d %~dp0\..

echo [1/9] 检查 Node.js...
where node >nul 2>nul
IF ERRORLEVEL 1 (
  echo 未检测到 Node.js，请先安装 https://nodejs.org/ 的 LTS 版本。
  pause
  exit /b 1
)

echo [2/9] 检查 npm...
where npm >nul 2>nul
IF ERRORLEVEL 1 (
  echo 未检测到 npm，请确认 Node.js 安装完整。
  pause
  exit /b 1
)

echo [3/9] 检查 PostgreSQL 客户端...
where psql >nul 2>nul
IF ERRORLEVEL 1 (
  echo 未检测到 psql，请先安装并配置 PostgreSQL。
  pause
  exit /b 1
)

IF NOT EXIST .env (
  echo [4/9] 创建 .env 文件...
  copy .env.example .env >nul
) ELSE (
  echo [4/9] 已检测到 .env，跳过创建。
)

set PORT=3000
for /f "usebackq tokens=1* delims==" %%A in (".env") do (
  if /I "%%A"=="PORT" (
    set PORT=%%B
  )
)

echo [5/9] 安装依赖...
npm install || goto :error

echo [6/9] 初始化数据库...
npm run db:generate || goto :error
npm run db:migrate || goto :error
npm run db:seed || goto :error

echo [7/9] 构建前后端...
npm run build || goto :error

echo [8/9] 可选安装 Nginx 反向代理 (Y/N)?
set /p INSTALL_NGINX=请输入选择: 
IF /I "%INSTALL_NGINX%"=="Y" (
  echo 提示：请手动从 https://nginx.org/en/download.html 下载 Windows 版本并配置反向代理。
  echo 建议将 /app 转发至 http://127.0.0.1:%PORT% ，/console 转发至同地址。
)

echo [9/9] 启动服务...
start "Decompo API" cmd /k "npm run start:prod"

echo 部署完成，API 监听端口 %PORT%。
echo 用户端地址: http://localhost:%PORT%/app
echo 管理后台地址: http://localhost:%PORT%/console
pause
exit /b 0

:error
echo 部署过程中出现错误，请检查日志后重试。
pause
exit /b 1
