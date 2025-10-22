param()

Write-Host "[gen-env] Collecting environment variables"
$envPath = Join-Path (Get-Location) ".env"

function Prompt-Default($label, $default) {
  $value = Read-Host "$label [$default]"
  if ([string]::IsNullOrWhiteSpace($value)) { return $default }
  return $value
}

$appDomain = Prompt-Default "APP_DOMAIN" "app.example.com"
$apiDomain = Prompt-Default "API_DOMAIN" "api.example.com"
$adminDomain = Prompt-Default "ADMIN_DOMAIN" "another.com"
$apiPort = Prompt-Default "API_PORT" "8080"
$adminPort = Prompt-Default "ADMIN_PORT" "8081"
$qwenBase = Prompt-Default "QWEN_BASE_URL" "https://dashscope.aliyuncs.com/compatible-mode/v1"
$qwenKey = Read-Host "QWEN_API_KEY"
$adminPassword = Read-Host "Initial admin password" -AsSecureString
$adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword))

@"
NODE_ENV=production
PORT=$apiPort

APP_DOMAIN=$appDomain
API_DOMAIN=$apiDomain
ADMIN_DOMAIN=$adminDomain
ADMIN_PORT=$adminPort
ALLOW_LOCALHOST=true

QWEN_BASE_URL=$qwenBase
QWEN_API_KEY=$qwenKey
MODEL_NAME=qwen-max
TEMPERATURE=0.6
MAX_TOKENS=256

DB_PATH=../data/app.db
ADMIN_PASSWORD=$adminPasswordPlain
"@ | Set-Content -Path $envPath -Encoding UTF8

Write-Host "[gen-env] .env written to $envPath"
