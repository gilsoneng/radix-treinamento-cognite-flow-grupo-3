# Starts the Cognite CDF MCP server with env from .cursor/mcp.env.
# Used by .cursor/mcp.json — do not pass secrets on the command line.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.cursor\mcp.env'

if (-not (Test-Path $envFile)) {
  Write-Error "Missing $envFile - run: npm run sync-mcp-env"
}

Get-Content -Path $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $eq = $line.IndexOf('=')
  if ($eq -lt 1) { return }
  $key = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim()
  Set-Item -Path "env:$key" -Value $value
}

Set-Location $root

$python = $null
foreach ($candidate in @('python', 'py')) {
  $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
  if ($cmd) {
    $python = $cmd.Source
    break
  }
}

if (-not $python) {
  Write-Error 'Python not found on PATH. Install Python 3.10+ and run: pip install cog-mcp-experimental'
}

if ($python -like '*py.exe') {
  & $python -3 -m cog_mcp.server
} else {
  & $python -m cog_mcp.server
}
