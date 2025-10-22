param(
  [string]$Version = "1.24.0"
)

Write-Host "安装并配置 Nginx" -ForegroundColor Cyan
$nginxRoot = Join-Path $PSScriptRoot "..\runtime\nginx"
if (!(Test-Path $nginxRoot)) {
  New-Item -ItemType Directory -Force -Path $nginxRoot | Out-Null
}
$zipPath = Join-Path $env:TEMP "nginx-$Version.zip"
Invoke-WebRequest -Uri "https://nginx.org/download/nginx-$Version.zip" -OutFile $zipPath -UseBasicParsing
Expand-Archive -Path $zipPath -DestinationPath $nginxRoot -Force
Copy-Item -Path "$PSScriptRoot\..\infra\nginx\*" -Destination "$nginxRoot\nginx-$Version" -Recurse -Force
Write-Host "Nginx 安装完成。请根据需要配置 NSSM 或其它服务管理器。" -ForegroundColor Green
