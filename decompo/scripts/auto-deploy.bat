@echo off
setlocal
set SCRIPT_DIR=%~dp0
set POWERSHELL=powershell -NoLogo -NoProfile -ExecutionPolicy Bypass
pushd %SCRIPT_DIR%\..
%POWERSHELL% -File "%SCRIPT_DIR%auto-deploy.ps1"
if errorlevel 1 (
  echo 自动部署失败，请检查输出。
  popd
  exit /b 1
)
popd
echo 部署脚本执行完成。
exit /b 0
