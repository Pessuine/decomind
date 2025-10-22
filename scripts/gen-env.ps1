$envPath = Join-Path $PSScriptRoot "..\.env"

$questions = @(
    @{ key = "APP_DOMAIN"; prompt = "App domain"; default = "app.example.com" },
    @{ key = "API_DOMAIN"; prompt = "API domain"; default = "api.example.com" },
    @{ key = "ADMIN_DOMAIN"; prompt = "Admin domain"; default = "another.com" },
    @{ key = "API_PORT"; prompt = "API port"; default = "8080" },
    @{ key = "ADMIN_PORT"; prompt = "Admin port"; default = "8081" },
    @{ key = "QWEN_BASE_URL"; prompt = "Qwen base URL"; default = "https://dashscope.aliyuncs.com/compatible-mode/v1" },
    @{ key = "QWEN_API_KEY"; prompt = "Qwen API key"; default = "" },
    @{ key = "ADMIN_PASSWORD"; prompt = "Initial admin password"; default = "ChangeMe123" }
)

$lines = @()
foreach ($q in $questions) {
    $value = Read-Host "$($q.prompt) [$($q.default)]"
    if ([string]::IsNullOrWhiteSpace($value)) {
        $value = $q.default
    }
    $lines += "$($q.key)=$value"
}

Set-Content -Path $envPath -Value ($lines -join "`n")
Write-Host ".env generated at $envPath"
