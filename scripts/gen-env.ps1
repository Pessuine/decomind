Param()

function Prompt-Default($message, $default) {
  $response = Read-Host "$message [$default]"
  if ([string]::IsNullOrWhiteSpace($response)) {
    return $default
  }
  return $response
}

$root = Resolve-Path "$PSScriptRoot/.."
$envPath = Join-Path $root ".env"

$appDomain = Prompt-Default "APP_DOMAIN" "app.example.com"
$apiDomain = Prompt-Default "API_DOMAIN" "api.example.com"
$adminDomain = Prompt-Default "ADMIN_DOMAIN" "another.com"
$apiPort = Prompt-Default "API_PORT" "8080"
$adminPort = Prompt-Default "ADMIN_PORT" "8081"
$qwenBase = Prompt-Default "QWEN_BASE_URL" "https://dashscope.aliyuncs.com/compatible-mode/v1"
$qwenKey = Read-Host "QWEN_API_KEY"
$adminPassword = Read-Host "ADMIN_PASSWORD (will be hashed later)"

$lines = @()
$lines += "APP_DOMAIN=$appDomain"
$lines += "API_DOMAIN=$apiDomain"
$lines += "ADMIN_DOMAIN=$adminDomain"
$lines += "API_PORT=$apiPort"
$lines += "ADMIN_PORT=$adminPort"
$lines += "QWEN_BASE_URL=$qwenBase"
$lines += "QWEN_API_KEY=$qwenKey"
$lines += "ADMIN_PASSWORD=$adminPassword"

Set-Content -Path $envPath -Value ($lines -join "`n")
Write-Host "[gen-env] .env created at $envPath"
