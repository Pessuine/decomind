param()

Write-Host "[install-pm2] Ensuring PM2 is installed"
$npm = Get-Command npm -ErrorAction Stop
$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if ($null -eq $pm2) {
  Write-Host "[install-pm2] Installing PM2 globally"
  npm install pm2@latest -g
} else {
  Write-Host "[install-pm2] PM2 already installed"
}

Write-Host "[install-pm2] Configuring PM2 startup"
pm2 startup || Write-Host "[install-pm2] pm2 startup returned non-zero"
