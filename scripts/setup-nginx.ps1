param(
  [string]$InstallDir = "C:\\nginx"
)

Write-Host "[nginx] Preparing installation directory at $InstallDir"
if (-not (Test-Path $InstallDir)) {
  New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

$tempZip = Join-Path $env:TEMP 'nginx.zip'
Invoke-WebRequest -Uri 'https://nginx.org/download/nginx-1.24.0.zip' -OutFile $tempZip

Expand-Archive -LiteralPath $tempZip -DestinationPath $InstallDir -Force
$expanded = Get-ChildItem $InstallDir -Directory | Select-Object -First 1
$nginxRoot = $expanded.FullName

Write-Host "[nginx] Applying configuration templates"
Copy-Item "$PSScriptRoot/../infra/nginx/nginx.conf.template" "$nginxRoot/conf/nginx.conf" -Force
Copy-Item "$PSScriptRoot/../infra/nginx/sites" "$nginxRoot/conf/sites" -Recurse -Force

Write-Host "[nginx] Registering Windows service via NSSM"
$nssm = Join-Path $InstallDir 'nssm.exe'
if (-not (Test-Path $nssm)) {
  Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile "$InstallDir/nssm.zip"
  Expand-Archive "$InstallDir/nssm.zip" -DestinationPath $InstallDir -Force
  $nssm = (Get-ChildItem -Path $InstallDir -Recurse -Filter nssm.exe | Select-Object -First 1).FullName
}
& $nssm install nginx "$nginxRoot/nginx.exe"
& $nssm set nginx AppDirectory $nginxRoot
& $nssm start nginx

Write-Host '[nginx] Installation completed.'
