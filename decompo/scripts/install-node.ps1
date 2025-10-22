param()
Write-Host "[Install-Node] 检测 Node.js LTS..."
$requiredVersion = [Version]"18.0.0"
$nodeVersion = $null
try {
  $versionText = node -v 2>$null
  if ($LASTEXITCODE -eq 0 -and $versionText) {
    $nodeVersion = [Version]($versionText.TrimStart('v'))
  }
} catch {}

if ($nodeVersion -and $nodeVersion -ge $requiredVersion) {
  Write-Host "已安装 Node.js $nodeVersion"
  return
}

Write-Host "未检测到符合要求的 Node.js，正在通过 winget 安装..."
$pkg = "OpenJS.NodeJS.LTS"
$winget = Get-Command winget -ErrorAction SilentlyContinue
if ($winget) {
  winget install --id $pkg --exact --accept-source-agreements --accept-package-agreements
} else {
  $temp = Join-Path $env:TEMP "node-lts.msi"
  Invoke-WebRequest -Uri "https://nodejs.org/dist/latest-v18.x/node-v18.20.4-x64.msi" -OutFile $temp -UseBasicParsing
  Start-Process msiexec.exe -ArgumentList "/i `"$temp`" /qn" -Wait
}

Write-Host "Node.js 安装完成，请重新打开终端以刷新 PATH（若首次安装）。"
