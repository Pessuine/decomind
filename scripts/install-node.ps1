Param()

Write-Host "检测 Node.js 版本..."
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $version = (& node -v) -replace "v", ""
  if ([version]$version -ge [version]"18.0.0") {
    Write-Host "Node.js 已安装: $version"
    exit 0
  }
}

Write-Host "开始安装 Node.js LTS..."
$installer = "$env:TEMP\\node-lts.msi"
Invoke-WebRequest -Uri "https://nodejs.org/dist/latest-v18.x/node-v18.20.3-x64.msi" -OutFile $installer
Start-Process msiexec.exe -Wait -ArgumentList "/i `"$installer`" /qn"
Remove-Item $installer -ErrorAction SilentlyContinue
Write-Host "Node.js 安装完成"
