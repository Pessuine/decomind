param()

function Read-Value($prompt, $default) {
  if ($null -ne $default -and $default -ne '') {
    $value = Read-Host "$prompt [$default]"
    if ($value -eq '') { return $default }
    return $value
  }
  return Read-Host $prompt
}

$APP_DOMAIN = Read-Value 'APP domain' 'app.example.com'
$API_DOMAIN = Read-Value 'API domain' 'api.example.com'
$ADMIN_DOMAIN = Read-Value 'Admin domain' 'another.com'
$API_PORT = Read-Value 'API port' '8080'
$ADMIN_PORT = Read-Value 'Admin port' '8081'
$QWEN_BASE_URL = Read-Value 'Qwen base URL' 'https://dashscope.aliyuncs.com/compatible-mode/v1'
$QWEN_API_KEY = Read-Value 'Qwen API Key' ''
if (-not $QWEN_API_KEY) { throw 'Qwen API Key is required.' }
$MODEL_NAME = Read-Value 'Model name' 'qwen-max'
$ADMIN_PASSWORD = Read-Host 'Initial admin password' -AsSecureString
$AdminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ADMIN_PASSWORD))

Write-Host '[secrets] Generating Argon2 hash via npx argon2-cli...'
$hashOutput = npx.cmd --yes argon2-cli "$AdminPasswordPlain"
$AdminPasswordHash = ($hashOutput | Select-String -Pattern '^\$argon2').Line
if (-not $AdminPasswordHash) { throw 'Failed to compute Argon2 hash.' }

function New-Base32Secret($bytesLength) {
  $bytes = New-Object byte[] $bytesLength
  (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
  $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  $builder = New-Object System.Text.StringBuilder
  $buffer = 0
  $bitsLeft = 0
  foreach ($b in $bytes) {
    $buffer = ($buffer -shl 8) -bor $b
    $bitsLeft += 8
    while ($bitsLeft -ge 5) {
      $bitsLeft -= 5
      $index = ($buffer -shr $bitsLeft) -band 31
      [void]$builder.Append($alphabet[$index])
    }
  }
  if ($bitsLeft -gt 0) {
    $index = ($buffer -shl (5 - $bitsLeft)) -band 31
    [void]$builder.Append($alphabet[$index])
  }
  return $builder.ToString()
}

$TOTP_SECRET = New-Base32Secret 20
$Issuer = 'Decomind Admin'
$OtpUrl = "otpauth://totp/$([Uri]::EscapeDataString($Issuer)):$([Uri]::EscapeDataString('admin@' + $ADMIN_DOMAIN))?secret=$TOTP_SECRET&issuer=$([Uri]::EscapeDataString($Issuer))&digits=6&period=30"

Write-Host '[totp] Writing QR code to scripts/totp-setup.png'
$qrPath = Join-Path $PSScriptRoot 'totp-setup.png'
npx.cmd --yes qrcode "$OtpUrl" -o "$qrPath"

$apiEnv = @(
  "NODE_ENV=production",
  "PORT=$API_PORT",
  "APP_DOMAIN=$APP_DOMAIN",
  "API_DOMAIN=$API_DOMAIN",
  "ADMIN_DOMAIN=$ADMIN_DOMAIN",
  "ALLOW_LOCALHOST=true",
  "QWEN_BASE_URL=$QWEN_BASE_URL",
  "QWEN_API_KEY=$QWEN_API_KEY",
  "MODEL_NAME=$MODEL_NAME",
  "TEMPERATURE=0.6",
  "MAX_TOKENS=256",
  "DB_PATH=../data/app.db",
  "ADMIN_PASSWORD_HASH=$AdminPasswordHash",
  "TOTP_SECRET=$TOTP_SECRET"
)
$apiEnvPath = Join-Path $PSScriptRoot '..\\apps\\api\\.env'
$apiEnv | Set-Content -Path $apiEnvPath -Encoding UTF8

$adminEnv = @(
  "NODE_ENV=production",
  "PORT=$ADMIN_PORT",
  "VITE_API_BASE=https://$API_DOMAIN",
  "ADMIN_DOMAIN=$ADMIN_DOMAIN"
)
$adminEnvPath = Join-Path $PSScriptRoot '..\\apps\\admin\\.env'
$adminEnv | Set-Content -Path $adminEnvPath -Encoding UTF8

$deployVarsPath = Join-Path $PSScriptRoot 'deploy-vars.cmd'
@(
  "set APP_DOMAIN=$APP_DOMAIN",
  "set API_DOMAIN=$API_DOMAIN",
  "set ADMIN_DOMAIN=$ADMIN_DOMAIN",
  "set API_PORT=$API_PORT",
  "set ADMIN_PORT=$ADMIN_PORT"
) | Set-Content -Path $deployVarsPath -Encoding ASCII

Write-Host '[env] Generated apps/api/.env and apps/admin/.env'
Write-Host "[totp] Secret: $TOTP_SECRET"
Write-Host "[totp] Otpauth URL: $OtpUrl"
