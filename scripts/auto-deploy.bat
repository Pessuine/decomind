@echo off
setlocal enabledelayedexpansion

set ROOT=%~dp0..
cd /d "%ROOT%"

echo [1/9] Ensuring Node.js LTS is installed...
powershell -ExecutionPolicy Bypass -File "%~dp0install-node.ps1"
if errorlevel 1 goto :error

echo [2/9] Ensuring PM2 is installed...
powershell -ExecutionPolicy Bypass -File "%~dp0install-pm2.ps1"
if errorlevel 1 goto :error

echo [3/9] Generating environment configuration...
powershell -ExecutionPolicy Bypass -File "%~dp0gen-env.ps1"
if errorlevel 1 goto :error

echo [4/9] Installing npm dependencies (root and workspaces)...
npm install
if errorlevel 1 goto :error

echo [5/9] Building API workspace...
npm run build --workspace apps/api
if errorlevel 1 goto :error

echo [6/9] Building web-h5 workspace...
npm run build --workspace apps/web-h5
if errorlevel 1 goto :error

echo [7/9] Building admin workspace...
npm run build --workspace apps/admin
if errorlevel 1 goto :error

echo [8/9] Initializing SQLite database...
node scripts\init-db.js
if errorlevel 1 goto :error

if /i "%1"=="--with-nginx" (
  echo [Optional] Installing and configuring Nginx...
  powershell -ExecutionPolicy Bypass -File "%~dp0setup-nginx.ps1"
)

echo [9/9] Starting services with PM2...
pm2 delete decompo-api >nul 2>nul
pm2 delete decompo-admin >nul 2>nul
pm2 start node --name decompo-api --cwd "%ROOT%" -- apps\api\dist\index.js
if errorlevel 1 goto :error
pm2 start node --name decompo-admin --cwd "%ROOT%" -- apps\admin\serve.js
if errorlevel 1 goto :error
pm2 save
pm2 startup >nul

set APP_DOMAIN=
set API_DOMAIN=
set ADMIN_DOMAIN=
set API_PORT=
set ADMIN_PORT=
for /f "usebackq tokens=1,2 delims==" %%A in ("apps\api\.env") do (
  if /i "%%A"=="APP_DOMAIN" set APP_DOMAIN=%%B
  if /i "%%A"=="API_DOMAIN" set API_DOMAIN=%%B
  if /i "%%A"=="ADMIN_DOMAIN" set ADMIN_DOMAIN=%%B
  if /i "%%A"=="PORT" set API_PORT=%%B
)
for /f "usebackq tokens=1,2 delims==" %%A in ("apps\admin\.env") do (
  if /i "%%A"=="PORT" set ADMIN_PORT=%%B
)

echo Deployment completed successfully.
echo API listening at https://%API_DOMAIN% (port %API_PORT%)
echo Admin available at https://%ADMIN_DOMAIN% (port %ADMIN_PORT%)
if not "%ADMIN_DOMAIN%"=="" start https://%ADMIN_DOMAIN%

goto :eof

:error
echo Deployment failed. Please review the logs above.
exit /b 1
