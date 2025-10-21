Param(
  [string]$ApiDomain,
  [string]$AdminDomain,
  [int]$ApiPort = 8080,
  [int]$AdminPort = 8081
)

$nginxRoot = "$PSScriptRoot/../infra/nginx"
$installDir = "$env:ProgramFiles\\nginx"
if (-Not (Test-Path $installDir)) {
  Write-Host "下载并安装 Nginx..."
  $zipPath = "$env:TEMP\\nginx.zip"
  Invoke-WebRequest -Uri "https://nginx.org/download/nginx-1.25.5.zip" -OutFile $zipPath
  Expand-Archive -Path $zipPath -DestinationPath $env:ProgramFiles -Force
  Remove-Item $zipPath -ErrorAction SilentlyContinue
  Rename-Item "$env:ProgramFiles\\nginx-1.25.5" nginx -Force
}

Copy-Item "$nginxRoot/nginx.conf.template" "$installDir/conf/nginx.conf" -Force
Copy-Item "$nginxRoot/sites" "$installDir/conf" -Recurse -Force

(Get-Content "$installDir/conf/sites/api.example.com.conf") -replace 'api.example.com', $ApiDomain -replace '8080', $ApiPort | Set-Content "$installDir/conf/sites/$ApiDomain.conf"
Remove-Item "$installDir/conf/sites/api.example.com.conf"

(Get-Content "$installDir/conf/sites/another.com.conf") -replace 'another.com', $AdminDomain -replace '8081', $AdminPort | Set-Content "$installDir/conf/sites/$AdminDomain.conf"
Remove-Item "$installDir/conf/sites/another.com.conf"

Write-Host "注册 Nginx 服务..."
& nssm install nginx "$installDir/nginx.exe" "-p $installDir"
& nssm set nginx AppDirectory "$installDir"
& nssm restart nginx
