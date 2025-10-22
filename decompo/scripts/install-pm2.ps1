param()
Write-Host "[Install-PM2] 检测 PM2..."
$pm2Version = $null
try {
  $pm2Version = (pm2 -v 2>$null)
} catch {}
if ($pm2Version) {
  Write-Host "已安装 PM2 $pm2Version"
} else {
  Write-Host "未检测到 PM2，正在安装..."
  npm install pm2@latest -g
}
Write-Host "注册 PM2 开机自启..."
pm2 startup | Out-Null
