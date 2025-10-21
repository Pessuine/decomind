Param()

Write-Host "安装 PM2..."
& npm install pm2 -g | Out-Null
& pm2 install pm2-windows-startup | Out-Null
Write-Host "PM2 安装完成"
