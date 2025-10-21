param()

Write-Host "[node] Checking Node.js installation..."
$nodeVersion = try { (node --version) } catch { $null }
if ($nodeVersion) {
  if ($nodeVersion -match "v1[8-9]|v2[0-9]") {
    Write-Host "[node] Node.js already installed: $nodeVersion"
    exit 0
  }
  Write-Host "[node] Node.js version $nodeVersion is too old. Installing LTS..."
}

$installer = "$env:TEMP\\nodejs.msi"
Invoke-WebRequest -Uri "https://nodejs.org/dist/latest-v18.x/node-v18.19.0-x64.msi" -OutFile $installer
Start-Process msiexec.exe -ArgumentList "/i", $installer, "/qn", "INSTALLDIR=C:\\Program Files\\nodejs" -Wait -NoNewWindow
Remove-Item $installer -ErrorAction SilentlyContinue

$env:Path = "C:\\Program Files\\nodejs;" + $env:Path
Write-Host "[node] Node.js installed."
