param(
    [string]$NodeModulesPath = "$env:APPDATA\\npm"
)

function Ensure-Npm() {
    try {
        npm -v | Out-Null
    } catch {
        throw "npm is required but not found. Please ensure Node.js is installed."
    }
}

function Install-PM2() {
    Write-Host "Installing PM2 globally..."
    npm install pm2@latest -g
}

Ensure-Npm()

try {
    pm2 -v | Out-Null
    Write-Host "PM2 already installed."
} catch {
    Install-PM2()
}

pm2 -v | Out-Null
Write-Host "Configuring PM2 startup registration..."
$startupCommand = pm2 startup powershell | Out-String
Write-Host $startupCommand
Write-Host "PM2 installation and startup registration complete."
