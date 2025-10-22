param()
Write-Host "[Install-PM2] 检测 PM2..."

function Get-ToolPath {
  param([string[]]$Names)
  foreach ($name in $Names) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Path }
  }
  throw "无法找到命令: $($Names -join ', ')"
}

$pm2 = $null
try {
  $pm2 = Get-Command pm2 -ErrorAction Stop
} catch {}

if ($pm2) {
  Write-Host "已安装 PM2 ($($pm2.Source))"
} else {
  Write-Host "未检测到 PM2，正在安装..."
  $npmPath = Get-ToolPath -Names @("npm", "npm.cmd")
  & $npmPath install pm2@latest -g
  if ($LASTEXITCODE -ne 0) {
    throw "PM2 安装失败"
  }
  $pm2 = Get-Command pm2 -ErrorAction Stop
}

Write-Host "PM2 可执行文件：$($pm2.Source)"
