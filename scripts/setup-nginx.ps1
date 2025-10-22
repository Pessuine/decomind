Param()

Write-Host "[setup-nginx] Installing optional Nginx reverse proxy"
$installDir = Join-Path $env:ProgramFiles "nginx"
if (!(Test-Path $installDir)) {
  $zipUrl = "https://nginx.org/download/nginx-1.24.0.zip"
  $zipPath = Join-Path $env:TEMP "nginx.zip"
  Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
  Expand-Archive -Path $zipPath -DestinationPath $env:ProgramFiles -Force
  Rename-Item -Path (Join-Path $env:ProgramFiles "nginx-1.24.0") -NewName "nginx" -Force
}

Copy-Item "$PSScriptRoot/../infra/nginx" -Destination $installDir -Recurse -Force
Write-Host "[setup-nginx] Nginx configuration updated"
