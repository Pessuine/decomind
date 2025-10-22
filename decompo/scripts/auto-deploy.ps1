param()
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
  param(
    [string]$Message,
    [string]$Level = "info"
  )
  switch ($Level) {
    "info" { Write-Host "[部署] $Message" -ForegroundColor Cyan }
    "success" { Write-Host "[完成] $Message" -ForegroundColor Green }
    "error" { Write-Host "[失败] $Message" -ForegroundColor Red }
  }
}

function Invoke-Step {
  param(
    [string]$Description,
    [ScriptBlock]$Action
  )
  Write-Step $Description
  try {
    & $Action
    Write-Step "$Description 成功" "success"
  } catch {
    Write-Step "$Description 失败: $($_.Exception.Message)" "error"
    throw
  }
}

function Get-ToolPath {
  param(
    [string[]]$Names
  )
  foreach ($name in $Names) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Path }
  }
  throw "无法找到命令: $($Names -join ', ')"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $repoRoot

Invoke-Step "安装或升级 Node.js" { & (Join-Path $scriptDir "install-node.ps1") }
Invoke-Step "安装或升级 PM2" { & (Join-Path $scriptDir "install-pm2.ps1") }
Invoke-Step "生成 .env 配置" { & (Join-Path $scriptDir "gen-env.ps1") }

$npmPath = Get-ToolPath -Names @("npm", "npm.cmd")
$pm2Path = Get-ToolPath -Names @("pm2", "pm2.cmd")

function Invoke-Npm {
  param(
    [string]$WorkingDirectory,
    [string[]]$Arguments
  )
  Push-Location $WorkingDirectory
  try {
    & $npmPath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "npm 命令失败 ($($Arguments -join ' '))"
    }
  } finally {
    Pop-Location
  }
}

$projects = @(
  ".",
  "apps/api",
  "apps/web-h5",
  "apps/admin",
  "packages/shared-schemas",
  "packages/shared-utils"
)

foreach ($proj in $projects) {
  if (Test-Path (Join-Path $proj "package.json")) {
    Invoke-Step "安装依赖 $proj" { Invoke-Npm -WorkingDirectory $proj -Arguments @("install", "--legacy-peer-deps") }
  }
}

Invoke-Step "构建 H5 前端" { Invoke-Npm -WorkingDirectory "apps/web-h5" -Arguments @("run", "build") }
Invoke-Step "构建管理后台" { Invoke-Npm -WorkingDirectory "apps/admin" -Arguments @("run", "build") }
Invoke-Step "构建 API" { Invoke-Npm -WorkingDirectory "apps/api" -Arguments @("run", "build") }
Invoke-Step "初始化数据库" { Invoke-Npm -WorkingDirectory "apps/api" -Arguments @("run", "init-db") }

function Start-Pm2Service {
  param(
    [string]$Script,
    [string]$Name,
    [string]$WorkingDirectory = $repoRoot
  )
  Push-Location $WorkingDirectory
  try {
    & $pm2Path delete $Name 2>$null | Out-Null
    & $pm2Path start $Script --name $Name
    if ($LASTEXITCODE -ne 0) { throw "PM2 启动 $Name 失败" }
  } finally {
    Pop-Location
  }
}

Invoke-Step "启动 PM2 API 服务" { Start-Pm2Service -Script (Join-Path $repoRoot "apps/api/dist/index.js") -Name "decompo-api" }
Invoke-Step "启动 PM2 后台服务" { Start-Pm2Service -Script (Join-Path $repoRoot "apps/admin/serve.js") -Name "decompo-admin" }

Invoke-Step "保存 PM2 进程列表" { & $pm2Path save | Out-Null }
Invoke-Step "注册 PM2 开机自启" {
  $startup = Get-ToolPath -Names @("pm2-startup", "pm2")
  if ($startup.ToLower().EndsWith("pm2-startup.cmd") -or $startup.ToLower().EndsWith("pm2-startup")) {
    & $startup install | Out-Null
  } else {
    & $startup startup | Out-Null
  }
}

$installNginx = Read-Host "是否安装 Nginx? (y/N)"
if ($installNginx -and $installNginx.ToLower().StartsWith("y")) {
  Invoke-Step "安装 Nginx" { & (Join-Path $scriptDir "setup-nginx.ps1") }
}

function Read-EnvValue {
  param(
    [string]$Path,
    [string]$Key
  )
  if (-not (Test-Path $Path)) { return $null }
  $content = Get-Content $Path
  foreach ($line in $content) {
    if ($line -match "^$Key=(.*)") {
      return $Matches[1]
    }
  }
  return $null
}

$apiEnvPath = Join-Path $repoRoot "apps/api/.env"
$apiDomain = Read-EnvValue -Path $apiEnvPath -Key "API_DOMAIN"
$adminDomain = Read-EnvValue -Path $apiEnvPath -Key "ADMIN_DOMAIN"

Write-Step "部署完成，请访问：" "success"
if ($apiDomain) { Write-Host "  API: https://$apiDomain" }
if ($adminDomain) {
  Write-Host "  后台: https://$adminDomain"
  try { Start-Process "https://$adminDomain" } catch {}
}

Write-Step "所有服务已通过 PM2 启动，可使用 'pm2 status' 查看详情。" "info"
