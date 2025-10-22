param()
Write-Host "[Nginx] 开始安装..."
$nginxDir = Join-Path $env:ProgramFiles "nginx"
if (Test-Path $nginxDir) {
  Write-Host "检测到已安装 Nginx: $nginxDir"
} else {
  $zipUrl = "https://nginx.org/download/nginx-1.26.1.zip"
  $tempZip = Join-Path $env:TEMP "nginx.zip"
  Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip -UseBasicParsing
  Expand-Archive -Path $tempZip -DestinationPath $env:ProgramFiles -Force
  $extracted = Get-ChildItem -Directory $env:ProgramFiles | Where-Object { $_.Name -like "nginx-*" } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($extracted) { Rename-Item -Path $extracted.FullName -NewName "nginx" -Force }
}

$serviceName = "nginx"
if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
  Write-Host "下载 NSSM..."
  $nssmZip = Join-Path $env:TEMP "nssm.zip"
  Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $nssmZip -UseBasicParsing
  Expand-Archive -Path $nssmZip -DestinationPath (Join-Path $env:ProgramFiles "nssm") -Force
  $env:Path += ";" + (Join-Path $env:ProgramFiles "nssm\win64")
}

$nssmExe = Get-Command nssm -ErrorAction Stop
& $nssmExe.Path install $serviceName (Join-Path $nginxDir "nginx.exe") "-p `"$nginxDir`" -c `"$nginxDir\\conf\\nginx.conf`""
& $nssmExe.Path set $serviceName Start SERVICE_AUTO_START

$configDir = Join-Path $nginxDir "conf"
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Join-Path $repoRoot ".."
Copy-Item -Path (Join-Path $repoRoot "infra/nginx/nginx.conf.template") -Destination (Join-Path $configDir "nginx.conf") -Force
Copy-Item -Path (Join-Path $repoRoot "infra/nginx/sites") -Destination $configDir -Recurse -Force

Write-Host "重新加载 Nginx 配置..."
& $nssmExe.Path restart $serviceName
Write-Host "Nginx 安装并启动完成。"
