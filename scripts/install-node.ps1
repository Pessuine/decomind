param(
    [string]$RequiredVersion = "18"
)

Write-Host "Checking Node.js installation"
$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -ne $node) {
    $version = (& node -v).TrimStart('v')
    if ([version]$version -ge [version]$RequiredVersion) {
        Write-Host "Node.js already installed: $version"
        exit 0
    }
}

Write-Host "Installing Node.js LTS via winget"
winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-source-agreements --accept-package-agreements
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install Node.js"
}
Write-Host "Node.js installation complete"
