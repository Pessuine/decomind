@echo off
setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%\..

powershell -ExecutionPolicy Bypass -File scripts/install-node.ps1 || goto :error
powershell -ExecutionPolicy Bypass -File scripts/install-pm2.ps1 || goto :error
powershell -ExecutionPolicy Bypass -File scripts/gen-env.ps1 || goto :error

for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
  if /I "%%a"=="API_DOMAIN" set API_DOMAIN=%%b
  if /I "%%a"=="ADMIN_DOMAIN" set ADMIN_DOMAIN=%%b
  if /I "%%a"=="API_PORT" set API_PORT=%%b
  if /I "%%a"=="ADMIN_PORT" set ADMIN_PORT=%%b
)

call npm install || goto :error
call npm run build || goto :error

set SQLITE_DB=%CD%\data\app.db
if not exist %CD%\data mkdir %CD%\data
if not exist "%ProgramFiles%\sqlite\sqlite3.exe" (
  echo sqlite3.exe not found in PATH. Attempting to call default binary.
)
sqlite3.exe "%SQLITE_DB%" ".read infra\\db\\init.sql" || goto :error

call pm2 start apps/api/dist/index.js --name decompo-api || goto :error
call pm2 start apps/admin/server.js --name decompo-admin || goto :error
call pm2 save || goto :error
call pm2 startup || goto :error

echo Deployment completed.
echo API: http://%API_DOMAIN%
echo Admin: http://%ADMIN_DOMAIN%
start https://%ADMIN_DOMAIN%

exit /b 0

:error
echo Deployment failed with error %errorlevel%.
exit /b %errorlevel%
