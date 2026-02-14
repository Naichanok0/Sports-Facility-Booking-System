<#
PowerShell helper to: 
- free a port (stop processes listening)
- load .env into environment for this session
- start `npm run dev` and tee output to server-start.log
- optionally run a SQL Server migration script via `sqlcmd`

Usage examples:
# Start server only
pwsh .\scripts\run_dev_and_migrate.ps1 -Port 3088

# Start server and run migration (you will be prompted for SQL password if not provided)
pwsh .\scripts\run_dev_and_migrate.ps1 -Port 3088 -RunMigration -SqlServer 'localhost' -SqlUser 'sa'

Notes:
- Run this script from an elevated PowerShell if you need permission to stop processes or start services.
- The script will read `..\.env` relative to the repo root and set env vars for the started process.
- It runs `npm run dev` in a separate PowerShell process and writes logs to server-start.log.
- Migration uses sqlcmd; ensure sqlcmd is installed and on PATH.
#>
param(
  [int]$Port = 3088,
  [switch]$RunMigration,
  [string]$SqlServer = 'localhost',
  [string]$SqlUser = 'sa',
  [string]$SqlPassword = '',
  [string]$MigrationFile = "$PSScriptRoot\..\db\migrate_add_refcode_and_fix_triggers.sql"
)

Set-StrictMode -Version Latest

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-ErrorMsg($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

# 1) Find and stop processes listening on the port
Write-Info "Checking for process listening on port $Port..."
$found = $null
try {
  $found = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
} catch { $found = $null }

if ($found -and $found.Count -gt 0) {
  $pids = $found | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($pid in $pids) {
    try {
      Write-Info "Stopping process PID $pid..."
      Stop-Process -Id $pid -Force -ErrorAction Stop
      Write-Info "Stopped PID $pid"
    } catch {
      Write-Warn "Could not stop PID $pid: $_"
    }
  }
} else {
  Write-Info "No listener found on port $Port."
}

# 2) Load .env into environment variables for this session
$envFilePath = Join-Path $PSScriptRoot '..\.env'
if (Test-Path $envFilePath) {
  Write-Info "Loading environment variables from $envFilePath"
  Get-Content $envFilePath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line -match '^\s*#') { return }
    if ($line -notmatch '=') { return }
    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $val = $parts[1].Trim()
    # strip optional quotes
    if ($val.Length -ge 2 -and (($val[0] -eq '"' -and $val[-1] -eq '"') -or ($val[0] -eq "'" -and $val[-1] -eq "'"))) {
      $val = $val.Substring(1, $val.Length-2)
    }
    if ($key) {
      $env:$key = $val
      Write-Info "Set env $key"
    }
  }
} else {
  Write-Warn "No .env file found at $envFilePath — continuing with existing environment variables"
}

# 3) Start server (npm run dev) and tee logs
Push-Location (Join-Path $PSScriptRoot '..')
try {
  $log = Join-Path (Get-Location) 'server-start.log'
  Write-Info "Starting server in background. Logs -> $log"

  # Use pwsh to run npm so that env vars we set in this process are inherited by the child pwsh only if using Start-Process with -NoNewWindow is run in same session
  # To ensure env vars are visible, we'll start a new pwsh process that sources the same .env via command line.
  $cmd = "npm run dev 2>&1 | Tee-Object -FilePath '$log'"
  Start-Process -FilePath pwsh -ArgumentList '-NoProfile','-NoExit','-Command',$cmd -WorkingDirectory (Get-Location) -WindowStyle Hidden
  Write-Info "Server start invoked. Wait a few seconds and then inspect $log (Get-Content -Wait $log)"
} catch {
  Write-ErrorMsg "Failed to start server: $_"
  Pop-Location
  exit 1
}

# 4) Optionally run migration
if ($RunMigration) {
  Write-Info "Running migration script: $MigrationFile"
  if (-not (Test-Path $MigrationFile)) {
    Write-ErrorMsg "Migration file not found: $MigrationFile"
  } else {
    # Ensure sqlcmd exists
    $sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
    if (-not $sqlcmd) {
      Write-ErrorMsg "sqlcmd not found on PATH. Install SQL Server Command Line Tools or skip migration."
    } else {
      if (-not $SqlPassword) {
        $secure = Read-Host -AsSecureString "Enter SQL password for $SqlUser@$SqlServer"
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
      } else {
        $plain = $SqlPassword
      }
      $escapedPassword = $plain -replace '"','`"'
      $escapedFile = $MigrationFile -replace "'","`'"
      $sqlcmdArgs = "-S $SqlServer -U $SqlUser -P \"$escapedPassword\" -i \"$MigrationFile\""
      Write-Info "Executing: sqlcmd $sqlcmdArgs"
      try {
        & sqlcmd -S $SqlServer -U $SqlUser -P $plain -i $MigrationFile
        if ($LASTEXITCODE -eq 0) { Write-Info "Migration completed successfully." } else { Write-Warn "sqlcmd returned code $LASTEXITCODE" }
      } catch {
        Write-ErrorMsg "Migration failed: $_"
      }
    }
  }
}

Pop-Location
Write-Info "Script finished. Check server-start.log and SQL output (if run)."
