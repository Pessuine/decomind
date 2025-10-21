@echo off
setlocal enabledelayedexpansion

cd /d %~dp0\..

if not exist node_modules (
  echo [info] Bootstrapping repository dependencies...
)

powershell -ExecutionPolicy Bypass -File "%~dp0install-node.ps1" || goto :error
powershell -ExecutionPolicy Bypass -File "%~dp0install-pm2.ps1" || goto :error
echo [npm] Ensuring root dependencies for tooling...
call npm install || goto :error
powershell -ExecutionPolicy Bypass -File "%~dp0gen-env.ps1" || goto :error
if exist "%~dp0deploy-vars.cmd" call "%~dp0deploy-vars.cmd"

for %%D in ("apps\\api" "apps\\admin" "apps\\web-h5" "packages\\shared-schemas" "packages\\shared-utils") do (
  if exist %%D\package.json (
    echo [npm] Installing dependencies in %%D
    call npm install --prefix %%D || goto :error
  )
)

for %%D in ("apps\\web-h5" "apps\\admin" "apps\\api") do (
  if exist %%D\package.json (
    echo [build] Building %%D
    call npm run build --prefix %%D || goto :error
  )
)

echo [db] Initialising SQLite database
node apps\api\scripts\init-db.cjs || goto :error

echo [pm2] Restarting services
pm2 delete decompo-api >NUL 2>&1
pm2 delete decompo-admin >NUL 2>&1
pm2 start apps\api\dist\index.cjs --name decompo-api || goto :error
pm2 start node --name decompo-admin -- apps\admin\server.cjs || goto :error
pm2 save || goto :error

echo.
echo Deployment complete.
echo - API: http://%API_DOMAIN%
echo - Admin: http://%ADMIN_DOMAIN%
exit /b 0

:error
echo Deployment failed. See the logs above for more information.
exit /b 1
