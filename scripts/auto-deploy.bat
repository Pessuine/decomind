@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Auto deployment workflow for Decompo/分解力
REM This script assumes Windows Server environment without Docker.
REM It orchestrates Node.js installation, dependency setup, database init and service startup.

call powershell -ExecutionPolicy Bypass -File "%~dp0install-node.ps1" || goto :error
call powershell -ExecutionPolicy Bypass -File "%~dp0install-pm2.ps1" || goto :error

choice /M "Install and configure optional Nginx reverse proxy?"
if errorlevel 2 (
  echo Skipping Nginx installation.
) else (
  call powershell -ExecutionPolicy Bypass -File "%~dp0setup-nginx.ps1" || goto :error
)

call powershell -ExecutionPolicy Bypass -File "%~dp0gen-env.ps1" || goto :error

call npm install || goto :error
for %%D in (apps\api apps\admin apps\web-h5 packages\shared-schemas packages\shared-utils) do (
  if exist %%D\package.json (
    pushd %%D
    call npm install || goto :error
    popd
  )
)

for %%D in (apps\admin apps\web-h5) do (
  if exist %%D\package.json (
    pushd %%D
    call npm run build || goto :error
    popd
  )
)

sqlite3 infra\db\decompo.db < infra\db\init.sql || goto :error

pm2 start ecosystem.config.cjs || goto :error
pm2 save

echo Deployment complete.
exit /b 0

:error
echo Deployment failed. Check logs for details.
exit /b 1
