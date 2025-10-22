param(
  [string]$Version = "LTS"
)

Write-Host "安装或升级 Node.js ($Version)" -ForegroundColor Cyan
$winget = Get-Command winget -ErrorAction SilentlyContinue
if ($winget) {
  winget install --id OpenJS.NodeJS.LTS -e --source winget --silent
} else {
  $downloadUrl = "https://nodejs.org/dist/latest-v18.x/node-v18.19.1-x64.msi"
  $temp = Join-Path $env:TEMP "node-installer.msi"
  Invoke-WebRequest -Uri $downloadUrl -OutFile $temp -UseBasicParsing
  Start-Process msiexec.exe -Wait -ArgumentList "/i `"$temp`" /qn"
}
Write-Host "Node.js 安装完成" -ForegroundColor Green
