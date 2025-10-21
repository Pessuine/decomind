Param(
  [string]$AdminPassword,
  [string]$TotpSecret
)
# 兼容旧流程保留脚本，实际逻辑在 post-install.js 中完成
Write-Host "gen-env.ps1 已弃用，跳过。"
