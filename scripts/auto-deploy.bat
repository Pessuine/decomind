@echo off
setlocal enabledelayedexpansion

REM 分解力一键部署脚本
REM 步骤：安装 Node → 安装 PM2 → 可选安装 Nginx → 生成 .env → 安装依赖 → 构建前端 → 初始化 DB → 启动服务

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [1/8] Node.js 未安装，自动安装 LTS 版本...
  powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install-node.ps1"
) else (
  echo [1/8] 已检测到 Node.js。
)

where pm2 >nul 2>nul
if %errorlevel% neq 0 (
  echo [2/8] 正在安装 PM2...
  powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install-pm2.ps1"
) else (
  echo [2/8] 已检测到 PM2。
)

set /p INSTALL_NGINX="[3/8] 是否安装并配置 Nginx? (y/N): "
if /I "!INSTALL_NGINX!"=="Y" (
  powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%setup-nginx.ps1"
) else (
  echo [3/8] 跳过 Nginx 安装。
)

echo [4/8] 收集运行参数并生成 .env ...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%gen-env.ps1"
if %errorlevel% neq 0 goto :error

echo [5/8] 安装依赖...
cd /d %ROOT_DIR%
call npm install
if %errorlevel% neq 0 goto :error

echo [6/8] 构建前端应用...
call npm run build
if %errorlevel% neq 0 goto :error

echo [7/8] 初始化 SQLite 数据库...
powershell -ExecutionPolicy Bypass -Command "& { sqlite3 '%ROOT_DIR%\runtime\decompo.db' < '%ROOT_DIR%\infra\db\init.sql' }"
if %errorlevel% neq 0 goto :error

echo [8/8] 使用 PM2 启动 API 与后台...
if not exist runtime mkdir runtime
call pm2 start ecosystem.config.cjs --env production
if %errorlevel% neq 0 goto :error
call pm2 save

set ADMIN_URL=https://%ADMIN_DOMAIN%
if defined ADMIN_DOMAIN (
  echo 管理后台地址: https://%ADMIN_DOMAIN%
)

echo 部署完成！
exit /b 0

:error
echo 部署失败，请检查输出信息。
exit /b 1
