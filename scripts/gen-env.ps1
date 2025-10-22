$envPath = Join-Path $PSScriptRoot "..\apps\api\.env"
$adminEnvPath = Join-Path $PSScriptRoot "..\apps\admin\.env"

function Prompt-Value($label, $default) {
    if ($null -ne $default -and $default -ne "") {
        $prompt = "$label [$default]"
    } else {
        $prompt = $label
    }
    $value = Read-Host $prompt
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $default
    }
    return $value
}

$appDomain = Prompt-Value "APP_DOMAIN" "app.example.com"
$apiDomain = Prompt-Value "API_DOMAIN" "api.example.com"
$adminDomain = Prompt-Value "ADMIN_DOMAIN" "another.com"
$apiPort = Prompt-Value "API_PORT" "8080"
$adminPort = Prompt-Value "ADMIN_PORT" "8081"
$qwenBase = Prompt-Value "QWEN_BASE_URL" "https://dashscope.aliyuncs.com/compatible-mode/v1"
$qwenKey = Prompt-Value "QWEN_API_KEY" ""
$modelName = Prompt-Value "MODEL_NAME" "qwen-max"
$temperature = Prompt-Value "TEMPERATURE" "0.6"
$maxTokens = Prompt-Value "MAX_TOKENS" "256"

$securePassword = Read-Host "Initial admin password (leave blank to provide hash manually)" -AsSecureString
$adminHash = ""
if ($securePassword.Length -gt 0) {
    try {
        $plainPassword = [System.Net.NetworkCredential]::new("", $securePassword).Password
        Write-Host "Hashing password with argon2-cli via npx (this may take a moment)..."
        $hashOutput = npx.cmd -y argon2-cli --algorithm argon2id --memory-cost 19456 --time-cost 2 --parallelism 1 --hash $plainPassword 2>$null
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($hashOutput)) {
            throw "argon2-cli failed"
        }
        $adminHash = $hashOutput.Trim()
    } catch {
        Write-Warning "Automatic hashing failed: $($_.Exception.Message)"
        $adminHash = Read-Host "Enter precomputed ADMIN_PASSWORD_HASH"
    }
} else {
    $adminHash = Read-Host "ADMIN_PASSWORD_HASH"
}

if ([string]::IsNullOrWhiteSpace($adminHash)) {
    Write-Error "ADMIN_PASSWORD_HASH is required."
    exit 1
}

$dbPath = Prompt-Value "DB_PATH" "..\\data\\app.db"
$allowLocalhost = Prompt-Value "ALLOW_LOCALHOST" "true"

$envContent = @(
    "NODE_ENV=production",
    "PORT=$apiPort",
    "APP_DOMAIN=$appDomain",
    "API_DOMAIN=$apiDomain",
    "ADMIN_DOMAIN=$adminDomain",
    "ALLOW_LOCALHOST=$allowLocalhost",
    "QWEN_BASE_URL=$qwenBase",
    "QWEN_API_KEY=$qwenKey",
    "MODEL_NAME=$modelName",
    "TEMPERATURE=$temperature",
    "MAX_TOKENS=$maxTokens",
    "DB_PATH=$dbPath",
    "ADMIN_PASSWORD_HASH=$adminHash"
) -join [Environment]::NewLine

New-Item -ItemType Directory -Force -Path (Split-Path $envPath) | Out-Null
$envContent | Out-File -Encoding UTF8 -FilePath $envPath

$adminEnvContent = @(
    "NODE_ENV=production",
    "PORT=$adminPort",
    "API_DOMAIN=$apiDomain",
    "ADMIN_DOMAIN=$adminDomain"
) -join [Environment]::NewLine

New-Item -ItemType Directory -Force -Path (Split-Path $adminEnvPath) | Out-Null
$adminEnvContent | Out-File -Encoding UTF8 -FilePath $adminEnvPath

Write-Host "Generated API .env at $envPath"
Write-Host "Generated Admin .env at $adminEnvPath"
