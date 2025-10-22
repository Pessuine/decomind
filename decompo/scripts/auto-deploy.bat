@echo off
setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
pushd %SCRIPT_DIR%\..

set POWERSHELL=powershell -NoLogo -NoProfile -ExecutionPolicy Bypass

call :run "%SCRIPT_DIR%install-node.ps1" || goto :error
call :run "%SCRIPT_DIR%install-pm2.ps1" || goto :error
call :run "%SCRIPT_DIR%gen-env.ps1" || goto :error

call :npm_install . || goto :error
call :npm_install apps\api || goto :error
call :npm_install apps\web-h5 || goto :error
call :npm_install apps\admin || goto :error
call :npm_install packages\shared-schemas || goto :error
call :npm_install packages\shared-utils || goto :error

call :npm_run apps\web-h5 build || goto :error
call :npm_run apps\admin build || goto :error
call :npm_run apps\api build || goto :error

call :init_db || goto :error

call :start_pm2 "apps/api/dist/index.js" decompo-api || goto :error
call :start_pm2 "apps/admin/serve.js" decompo-admin || goto :error

%POWERSHELL% "pm2 save | Out-Null"
%POWERSHELL% "pm2 startup | Out-Null"

echo.
set /p INSTALL_NGINX="是否安装 Nginx? (y/N): "
if /I "%INSTALL_NGINX%"=="Y" (
  call :run "%SCRIPT_DIR%setup-nginx.ps1" || goto :error
)

echo 部署完成，请访问：
for /f "usebackq tokens=1,* delims==" %%A in (apps\api\.env) do (
  if /I "%%A"=="API_DOMAIN" set API_DOMAIN=%%B
  if /I "%%A"=="ADMIN_DOMAIN" set ADMIN_DOMAIN=%%B
)

echo API: https://%API_DOMAIN%
echo 后台: https://%ADMIN_DOMAIN%
start https://%ADMIN_DOMAIN%

echo.
echo 所有服务已通过 PM2 启动。若需重启：pm2 restart all
popd
exit /b 0

:run
%POWERSHELL% -File %1
if errorlevel 1 (
  echo [FAILED] %1
  exit /b 1
)
exit /b 0

:npm_install
pushd %1
if exist package.json (
  echo 安装依赖：%1
  call npm install --legacy-peer-deps
  if errorlevel 1 (
    popd
    exit /b 1
  )
)
popd
exit /b 0

:npm_run
pushd %1
if exist package.json (
  echo 运行 npm run %2 ：%1
  call npm run %2
  if errorlevel 1 (
    popd
    exit /b 1
  )
)
popd
exit /b 0

:init_db
if exist apps\api\.env (
  for /f "usebackq tokens=1,* delims==" %%A in (apps\api\.env) do (
    if /I "%%A"=="DB_PATH" set DB_PATH=%%B
  )
)
if "%DB_PATH%"=="" set DB_PATH=apps\api\data\app.db
if not exist apps\api\data mkdir apps\api\data
%POWERSHELL% "Write-Host '初始化 SQLite 数据库...'; $dbPath='%DB_PATH%'; $full=[System.IO.Path]::GetFullPath($dbPath); $sql=Get-Content -Raw -Path 'infra/db/init.sql'; if(-not (Test-Path $full)){New-Item -ItemType File -Path $full -Force | Out-Null}; $bytes=[Text.Encoding]::UTF8.GetBytes($sql); $temp=[System.IO.Path]::GetTempFileName(); [System.IO.File]::WriteAllBytes($temp,$bytes); & sqlite3.exe $full ".read $temp""
if errorlevel 1 exit /b 1
exit /b 0

:start_pm2
set SCRIPT=%1
set NAME=%2
%POWERSHELL% "pm2 delete %NAME% 2>$null | Out-Null"
%POWERSHELL% "pm2 start %SCRIPT% --name %NAME%"
if errorlevel 1 exit /b 1
exit /b 0

:error
echo 部署失败，请检查上方日志并重试。
popd
exit /b 1
