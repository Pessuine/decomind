param(
    [string]$InstallPath = "C:\\nginx",
    [string]$ServiceName = "nginx",
    [switch]$SkipInstall
)

$nginxUrl = "https://nginx.org/download/nginx-1.26.1.zip"
$tempZip = Join-Path $env:TEMP "nginx.zip"
$configSource = Join-Path $PSScriptRoot "..\infra\nginx"

if (-not $SkipInstall) {
    if (-Not (Test-Path $InstallPath)) {
        Write-Host "Downloading Nginx from $nginxUrl"
        Invoke-WebRequest -Uri $nginxUrl -OutFile $tempZip -UseBasicParsing
        Expand-Archive -Force -Path $tempZip -DestinationPath (Split-Path $InstallPath)
        $expanded = Get-ChildItem (Split-Path $InstallPath) -Directory | Where-Object { $_.Name -like "nginx-*" } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $expanded) { throw "Failed to extract Nginx." }
        if (Test-Path $InstallPath) { Remove-Item $InstallPath -Recurse -Force }
        Rename-Item $expanded.FullName $InstallPath
    }
}

Copy-Item -Path (Join-Path $configSource "nginx.conf.template") -Destination (Join-Path $InstallPath "conf\nginx.conf") -Force
Copy-Item -Path (Join-Path $configSource "sites\*") -Destination (Join-Path $InstallPath "conf\sites") -Force

if (-not (Test-Path (Join-Path $InstallPath "conf\sites"))) {
    New-Item -ItemType Directory -Path (Join-Path $InstallPath "conf\sites") | Out-Null
}

$nginxExe = Join-Path $InstallPath "nginx.exe"
if (-not (Test-Path $nginxExe)) {
    throw "nginx.exe not found at $nginxExe"
}

Write-Host "Registering Nginx as a Windows service via NSSM..."
$nssmExe = "C:\\nssm\\nssm.exe"
if (-not (Test-Path $nssmExe)) {
    Write-Host "NSSM not found. Downloading..."
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $nssmZip = Join-Path $env:TEMP "nssm.zip"
    Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip -UseBasicParsing
    Expand-Archive -Force -Path $nssmZip -DestinationPath (Split-Path $nssmExe)
    $nssmDir = Get-ChildItem (Split-Path $nssmExe) -Directory | Where-Object { $_.Name -like "nssm-*" } | Select-Object -First 1
    Copy-Item (Join-Path $nssmDir.FullName "win64\\nssm.exe") -Destination $nssmExe -Force
}

& $nssmExe install $ServiceName $nginxExe
& $nssmExe set $ServiceName AppDirectory $InstallPath
& $nssmExe set $ServiceName AppParameters "-p 80"
& $nssmExe set $ServiceName Start SERVICE_AUTO_START

Write-Host "Restarting Nginx service..."
if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Restart-Service -Name $ServiceName -Force
} else {
    Start-Service -Name $ServiceName
}

Write-Host "Nginx setup completed."
