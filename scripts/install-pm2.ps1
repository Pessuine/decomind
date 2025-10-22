Write-Host "Installing PM2 globally"
npm install pm2 -g
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install PM2"
}

Write-Host "Registering PM2 startup"
pm2 startup || throw "Failed to configure PM2 startup"
