param()

Write-Host "[pm2] Installing PM2 globally..."
npm install -g pm2@latest

Write-Host "[pm2] Registering PM2 startup service..."
pm2 startup PowerShell
