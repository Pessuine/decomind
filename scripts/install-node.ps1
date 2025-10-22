param(
    [string]$RequiredVersion = "18.0.0"
)

function Get-NodeVersion() {
    try {
        $versionOutput = node -v 2>$null
        if (-not $versionOutput) { return $null }
        $version = $versionOutput.TrimStart('v')
        return [version]$version
    } catch {
        return $null
    }
}

function Install-NodeViaWinget() {
    Write-Host "Installing Node.js LTS via winget..."
    winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
}

function Install-NodeViaMsi() {
    $temp = Join-Path $env:TEMP "node-lts.msi"
    $downloadUrl = "https://nodejs.org/dist/latest-v18.x/node-v18.20.4-x64.msi"
    Write-Host "Downloading Node.js MSI from $downloadUrl"
    Invoke-WebRequest -Uri $downloadUrl -OutFile $temp -UseBasicParsing
    Write-Host "Running MSI installer..."
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$temp`" /qn"
}

$installedVersion = Get-NodeVersion()
$required = [version]$RequiredVersion
if ($installedVersion -and $installedVersion -ge $required) {
    Write-Host "Node.js $installedVersion detected. Skipping installation."
    exit 0
}

Write-Host "Node.js LTS not found or version too low. Attempting installation..."
try {
    Install-NodeViaWinget()
} catch {
    Write-Warning "winget installation failed: $($_.Exception.Message). Falling back to MSI installer."
    Install-NodeViaMsi()
}

$installedVersion = Get-NodeVersion()
if (-not $installedVersion -or $installedVersion -lt $required) {
    Write-Error "Failed to install Node.js LTS."
    exit 1
}

Write-Host "Node.js $installedVersion installed successfully."
