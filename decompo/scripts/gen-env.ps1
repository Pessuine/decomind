param()
function Read-Input($prompt, $default) {
  if ($default) {
    $value = Read-Host "$prompt [$default]"
    if ([string]::IsNullOrWhiteSpace($value)) { return $default }
    return $value
  }
  return Read-Host $prompt
}

Write-Host "[Env] 生成环境变量文件"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$base = Join-Path $root ".."

$appDomain = Read-Input "APP_DOMAIN" "app.example.com"
$apiDomain = Read-Input "API_DOMAIN" "api.example.com"
$adminDomain = Read-Input "ADMIN_DOMAIN" "another.com"
$apiPort = Read-Input "API_PORT" "8080"
$adminPort = Read-Input "ADMIN_PORT" "4174"
$qwenBase = Read-Input "QWEN_BASE_URL" "https://dashscope.aliyuncs.com/compatible-mode/v1"
$qwenKey = Read-Input "QWEN_API_KEY" ""
$modelName = Read-Input "MODEL_NAME" "qwen-max"
$temp = Read-Input "TEMPERATURE" "0.6"
$maxTokens = Read-Input "MAX_TOKENS" "256"
$allowLocalhost = Read-Input "允许 localhost 访问? (true/false)" "true"
$adminPassword = Read-Input "初始后台密码" "ChangeMe#123"

if ([string]::IsNullOrEmpty($adminPassword)) {
  Write-Host "密码不可为空" -ForegroundColor Red
  exit 1
}

Write-Host "计算 Argon2 哈希..."
$argonScript = @'
import argon2
import sys
password = sys.argv[1]
print(argon2.PasswordHasher().hash(password), end="")
'@
$tempPy = New-TemporaryFile
Set-Content -Path $tempPy -Value $argonScript -Encoding UTF8
$hash = python $tempPy $adminPassword
Remove-Item $tempPy -Force

if (-not $hash) {
  Write-Host "生成 Argon2 哈希失败，请确认 Python/argon2-cffi 可用。" -ForegroundColor Red
  exit 1
}

$apiEnv = @"
NODE_ENV=production
PORT=$apiPort
APP_DOMAIN=$appDomain
API_DOMAIN=$apiDomain
ADMIN_DOMAIN=$adminDomain
ALLOW_LOCALHOST=$allowLocalhost
QWEN_BASE_URL=$qwenBase
QWEN_API_KEY=$qwenKey
MODEL_NAME=$modelName
TEMPERATURE=$temp
MAX_TOKENS=$maxTokens
DB_PATH=../data/app.db
ADMIN_PASSWORD_HASH=$hash
"@

$apiEnvPath = Join-Path $base "apps/api/.env"
New-Item -Path (Split-Path $apiEnvPath) -ItemType Directory -Force | Out-Null
Set-Content -Path $apiEnvPath -Value $apiEnv -Encoding UTF8

$adminEnv = @"
VITE_API_BASE=https://$apiDomain
VITE_APP_DOMAIN=https://$appDomain
VITE_ADMIN_DOMAIN=https://$adminDomain
VITE_ADMIN_PORT=$adminPort
"@
$adminEnvPath = Join-Path $base "apps/admin/.env"
New-Item -Path (Split-Path $adminEnvPath) -ItemType Directory -Force | Out-Null
Set-Content -Path $adminEnvPath -Value $adminEnv -Encoding UTF8

Write-Host "环境变量已生成："
Write-Host $apiEnvPath
Write-Host $adminEnvPath
