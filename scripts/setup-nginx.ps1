param(
  [string]$InstallPath = "C:\\nginx"
)

Write-Host "[setup-nginx] Setting up optional Nginx reverse proxy"
if (Test-Path $InstallPath) {
  Write-Host "[setup-nginx] Nginx already present at $InstallPath"
} else {
  $tempZip = Join-Path $env:TEMP "nginx.zip"
  Write-Host "[setup-nginx] Downloading latest nginx mainline"
  Invoke-WebRequest -Uri "https://nginx.org/download/nginx-1.24.0.zip" -OutFile $tempZip
  Expand-Archive -Path $tempZip -DestinationPath $env:TEMP -Force
  $extracted = Get-ChildItem -Directory -Path $env:TEMP -Filter "nginx-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  Move-Item $extracted.FullName $InstallPath -Force
}

$serviceName = "nginx"
Write-Host "[setup-nginx] Registering nginx as a Windows service via NSSM"
if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
  Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "$env:TEMP\\nssm.zip"
  Expand-Archive -Path "$env:TEMP\\nssm.zip" -DestinationPath "$env:TEMP" -Force
  $nssmPath = Get-ChildItem -Path "$env:TEMP" -Recurse -Filter "nssm.exe" | Select-Object -First 1
  $env:Path = "$($nssmPath.DirectoryName);$env:Path"
}

nssm install $serviceName "$InstallPath\\nginx.exe" "-c $InstallPath\\conf\\nginx.conf"
nssm set $serviceName Start SERVICE_AUTO_START

Write-Host "[setup-nginx] Copying template configuration"
Copy-Item "$(Join-Path $PSScriptRoot "..\\infra\\nginx\\*")" "$InstallPath\\" -Recurse -Force

Write-Host "[setup-nginx] Restarting nginx"
if (Get-Service $serviceName -ErrorAction SilentlyContinue) {
  Restart-Service $serviceName
} else {
  Start-Service $serviceName
}
