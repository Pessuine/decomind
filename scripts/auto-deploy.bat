@echo off
setlocal enabledelayedexpansion

:: Auto deployment entry point for Windows Server

set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%\..

call :log "Starting Decompo automated deployment"

powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install-node.ps1" || goto :error
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install-pm2.ps1" || goto :error
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%gen-env.ps1" || goto :error

call :log "Installing npm dependencies"
call npm install || goto :error

call :log "Building all workspaces"
call npm run build || goto :error

call :log "Initialising SQLite database"
if exist data\nul (echo Data directory exists) else mkdir data
powershell -ExecutionPolicy Bypass -Command "& { sqlite3.exe data/app.db < infra/db/init.sql }" || goto :error

call :log "Starting services with PM2"
call pm2 start apps/api/dist/index.js --name decompo-api || goto :error
call pm2 start apps/admin/server.cjs --name decompo-admin || goto :error
call pm2 save || goto :error
call pm2 startup || goto :error

set ADMIN_DOMAIN=
for /f "tokens=1,2 delims==" %%a in ('findstr /b "ADMIN_DOMAIN" .env') do if "%%a"=="ADMIN_DOMAIN" set ADMIN_DOMAIN=%%b
if not "!ADMIN_DOMAIN!"=="" (
  call :log "Opening admin console"
  start https://!ADMIN_DOMAIN!
)

call :log "Deployment completed successfully"
goto :eof

:log
  echo [auto-deploy] %~1
  goto :eof

:error
  echo Deployment failed with error level %errorlevel%.
  exit /b %errorlevel%
