Param()

Write-Host "[install-pm2] Installing PM2 globally"
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
  Write-Host "[install-pm2] PM2 already installed"
} else {
  npm install -g pm2
}

Write-Host "[install-pm2] Registering PM2 startup"
$startupInfo = pm2 startup powershell --silent
Write-Host $startupInfo
