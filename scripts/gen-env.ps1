$envPath = Join-Path $PSScriptRoot "..\.env"

Write-Host "生成 .env 文件" -ForegroundColor Cyan
$defaults = @{
  APP_DOMAIN = "app.example.com"
  API_DOMAIN = "api.example.com"
  ADMIN_DOMAIN = "another.com"
  API_PORT = "8080"
  ADMIN_PORT = "8081"
  QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
}

$config = @{}
foreach ($key in $defaults.Keys) {
  $current = Read-Host "$key [$($defaults[$key])]"
  if ([string]::IsNullOrWhiteSpace($current)) {
    $config[$key] = $defaults[$key]
  } else {
    $config[$key] = $current
  }
}

$config["QWEN_API_KEY"] = Read-Host "QWEN_API_KEY (必填)"
$config["ADMIN_PASSWORD"] = Read-Host "ADMIN_PASSWORD (初始后台密码)"

$content = ""
foreach ($key in $config.Keys) {
  $value = $config[$key]
  $content += "$key=$value`n"
}

Set-Content -Path $envPath -Value $content -Encoding UTF8
Write-Host ".env 已生成" -ForegroundColor Green
