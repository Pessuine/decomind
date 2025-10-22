param()

Write-Host "[install-node] Checking Node.js installation"
$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -ne $node) {
  $version = node -v
  Write-Host "[install-node] Node.js already installed: $version"
  return
}

Write-Host "[install-node] Installing Node.js LTS via winget"
winget install --exact OpenJS.NodeJS.LTS --silent
