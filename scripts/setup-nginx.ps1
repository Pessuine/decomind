param(
    [string]$NginxVersion = "1.25.2"
)

$nginxDir = Join-Path $PSScriptRoot "..\infra\nginx"
$installDir = "C:\\nginx"
if (Test-Path $installDir) {
    Write-Host "Nginx already installed"
    exit 0
}

$zipUrl = "https://nginx.org/download/nginx-$NginxVersion.zip"
$zipPath = Join-Path $env:TEMP "nginx-$NginxVersion.zip"
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
Expand-Archive -LiteralPath $zipPath -DestinationPath $env:TEMP -Force
Move-Item "$env:TEMP\nginx-$NginxVersion" $installDir

Copy-Item "$nginxDir\nginx.conf.template" "$installDir\conf\nginx.conf" -Force
Copy-Item "$nginxDir\sites\*" "$installDir\conf\sites-enabled\" -Force

Write-Host "Registering Nginx with NSSM"
& nssm install nginx "$installDir\nginx.exe" || throw "Failed to register Nginx service"
& nssm start nginx || throw "Failed to start Nginx"
