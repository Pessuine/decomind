Write-Host "安装 PM2 并注册自启动" -ForegroundColor Cyan
npm install -g pm2
pm2 startup windows --silent | Out-Null
Write-Host "PM2 安装完成" -ForegroundColor Green
