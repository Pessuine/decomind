@echo off
setlocal ENABLEDELAYEDEXPANSION

set ROOT_DIR=%~dp0..
cd /d %ROOT_DIR%

echo [1/9] 检查 Node.js LTS...
powershell -ExecutionPolicy Bypass -File scripts\install-node.ps1 || goto :error

echo [2/9] 安装 PM2...
powershell -ExecutionPolicy Bypass -File scripts\install-pm2.ps1 || goto :error

echo [3/9] 收集部署参数...
set /p APP_DOMAIN=APP_DOMAIN [app.example.com]: 
if "!APP_DOMAIN!"=="" set APP_DOMAIN=app.example.com
set /p API_DOMAIN=API_DOMAIN [api.example.com]: 
if "!API_DOMAIN!"=="" set API_DOMAIN=api.example.com
set /p ADMIN_DOMAIN=ADMIN_DOMAIN [another.com]: 
if "!ADMIN_DOMAIN!"=="" set ADMIN_DOMAIN=another.com
set /p API_PORT=API_PORT [8080]: 
if "!API_PORT!"=="" set API_PORT=8080
set /p ADMIN_PORT=ADMIN_PORT [8081]: 
if "!ADMIN_PORT!"=="" set ADMIN_PORT=8081
set /p QWEN_BASE_URL=QWEN_BASE_URL [https://dashscope.aliyuncs.com/compatible-mode/v1]: 
if "!QWEN_BASE_URL!"=="" set QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
set /p QWEN_API_KEY=QWEN_API_KEY: 
if "!QWEN_API_KEY!"=="" goto :error
set /p ADMIN_PASSWORD=初始后台密码: 
if "!ADMIN_PASSWORD!"=="" goto :error

set ENV_API=apps\api\.env
set ENV_ADMIN=apps\admin\.env

>"%ENV_API%" echo NODE_ENV=production
>>"%ENV_API%" echo PORT=!API_PORT!
>>"%ENV_API%" echo APP_DOMAIN=!APP_DOMAIN!
>>"%ENV_API%" echo API_DOMAIN=!API_DOMAIN!
>>"%ENV_API%" echo ADMIN_DOMAIN=!ADMIN_DOMAIN!
>>"%ENV_API%" echo QWEN_BASE_URL=!QWEN_BASE_URL!
>>"%ENV_API%" echo QWEN_API_KEY=!QWEN_API_KEY!
>>"%ENV_API%" echo DB_PATH=..\..\data\app.db

>"%ENV_ADMIN%" echo NODE_ENV=production
>>"%ENV_ADMIN%" echo PORT=!ADMIN_PORT!
>>"%ENV_ADMIN%" echo API_DOMAIN=!API_DOMAIN!
>>"%ENV_ADMIN%" echo ADMIN_DOMAIN=!ADMIN_DOMAIN!
>>"%ENV_ADMIN%" echo APP_DOMAIN=!APP_DOMAIN!

set BOOTSTRAP_FILE=apps\api\bootstrap.json
>"%BOOTSTRAP_FILE%" echo {
>>"%BOOTSTRAP_FILE%" echo   "adminPassword": "!ADMIN_PASSWORD!"
>>"%BOOTSTRAP_FILE%" echo }

echo [4/9] 安装依赖...
call npm install || goto :error

echo [5/9] 生成密钥与二维码...
node scripts\post-install.js || goto :error

echo [6/9] 构建前端...
call npm run build || goto :error

echo [7/9] 初始化数据库...
if not exist data mkdir data
powershell -ExecutionPolicy Bypass -Command "& { sqlite3 data/app.db < infra/db/init.sql }" || goto :error

echo [8/9] 使用 PM2 启动服务...
call pm2 delete decompo-api >nul 2>nul
call pm2 delete decompo-admin >nul 2>nul
call pm2 start apps/api/dist/index.js --name decompo-api || goto :error
call pm2 start npm --name decompo-admin -- run preview --prefix apps/admin || goto :error
call pm2 save || goto :error
call pm2 startup || goto :error

echo [9/9] （可选）配置 Nginx...
choice /M "是否安装配置 Nginx?" /C YN
if errorlevel 2 goto :skipNginx
powershell -ExecutionPolicy Bypass -File scripts\setup-nginx.ps1 -ApiDomain "!API_DOMAIN!" -AdminDomain "!ADMIN_DOMAIN!" -ApiPort !API_PORT! -AdminPort !ADMIN_PORT! || goto :error
:skipNginx

echo 完成！
echo H5: https://!APP_DOMAIN!
echo API: https://!API_DOMAIN!
echo 后台: https://!ADMIN_DOMAIN!
echo 请立即扫描输出二维码绑定 TOTP。
start https://!ADMIN_DOMAIN!
exit /b 0

:error
echo 部署失败，请检查上述日志。
exit /b 1
