Param()

Write-Host "[install-node] Ensuring Node.js LTS is installed"
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $version = node -v
  Write-Host "[install-node] Node.js already installed: $version"
  return
}

if (Get-Command winget -ErrorAction SilentlyContinue) {
  Write-Host "[install-node] Installing via winget"
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
} else {
  $msiUrl = "https://nodejs.org/dist/v18.19.1/node-v18.19.1-x64.msi"
  $msiPath = Join-Path $env:TEMP "node-lts.msi"
  Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath
  Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /qn" -Wait
}

Write-Host "[install-node] Node.js installation step completed"
