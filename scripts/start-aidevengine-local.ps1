# AiDevEngine Local Runtime Launcher V1
# Starts or reuses a healthy localhost:4321 runtime and opens Command Center.

param(
  [int]$Port = 4321,
  [int]$MaxWaitSeconds = 120,
  [switch]$NoBrowser,
  [switch]$HealthCheckOnly
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..')).Path
$BaseUrl = "http://127.0.0.1:$Port"
$HealthUrl = "$BaseUrl/api/brain/health"
$RegistryUrl = "$BaseUrl/api/projects/registry.json"

function Write-LauncherStatus {
  param([string]$Message)
  Write-Host "[AiDevEngine] $Message"
}

function Test-AiDevEngineCommandLine {
  param([string]$CommandLine)
  if ([string]::IsNullOrWhiteSpace($CommandLine)) { return $false }
  return ($CommandLine -match 'founder-reality-server') -or ($CommandLine -match 'npm run dev')
}

function Get-Port4321Owners {
  $processIds = New-Object System.Collections.Generic.HashSet[int]
  $commandLines = @()
  $intendedAiDevEngine = $false

  try {
    $lines = netstat -ano | Select-String ":$Port"
    foreach ($line in $lines) {
      $text = $line.ToString().Trim()
      if ($text -notmatch 'LISTENING') { continue }
      $parts = $text -split '\s+'
      $processId = [int]$parts[$parts.Length - 1]
      if ($processId -gt 0) { [void]$processIds.Add($processId) }
    }
  } catch {
    # no listeners
  }

  foreach ($processId in $processIds) {
    try {
      $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$processId").CommandLine
      if ($cmd) {
        $commandLines += ("pid {0}: {1}" -f $processId, $cmd)
        if (Test-AiDevEngineCommandLine $cmd) { $intendedAiDevEngine = $true }
      }
    } catch {
      $commandLines += ("pid {0}: (command line unavailable)" -f $processId)
    }
  }

  return [pscustomobject]@{
    Port = $Port
    Listening = ($processIds.Count -gt 0)
    Pids = @($processIds)
    IntendedAiDevEngine = $intendedAiDevEngine
    CommandLines = $commandLines
  }
}

function Invoke-AiDevEngineHealthProbe {
  try {
    $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 8
    $body = $null
    if ($response.Content) {
      $body = $response.Content | ConvertFrom-Json
    }
    return [pscustomobject]@{
      Ok = $true
      StatusCode = [int]$response.StatusCode
      Body = $body
      Error = $null
    }
  } catch {
    return [pscustomobject]@{
      Ok = $false
      StatusCode = 0
      Body = $null
      Error = $_.Exception.Message
    }
  }
}

function Test-AiDevEngineHealthy {
  param($HealthBody, [int]$StatusCode)

  if ($StatusCode -ne 200 -or -not $HealthBody) { return $false }
  if ($HealthBody.buildIntentRouting -ne $true) { return $false }
  if ($HealthBody.registryLoaded -ne $true) { return $false }
  if ($HealthBody.runtimeReady -ne $true) { return $false }
  if ($HealthBody.postAllowed -ne $true) { return $false }
  return $true
}

function Test-AiDevEngineRegistryReady {
  try {
    $response = Invoke-WebRequest -Uri $RegistryUrl -UseBasicParsing -TimeoutSec 8
    if ([int]$response.StatusCode -ne 200) { return $false }
    $body = $response.Content | ConvertFrom-Json
    return ($null -ne $body.registry)
  } catch {
    return $false
  }
}

function Stop-StaleAiDevEngineListeners {
  param($Owners)

  foreach ($processId in $Owners.Pids) {
    $cmd = $null
    try {
      $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$processId").CommandLine
    } catch {
      continue
    }

    if (-not (Test-AiDevEngineCommandLine $cmd)) {
      Write-LauncherStatus "Port $Port owned by non-AiDevEngine PID $processId - not stopping unrelated process."
      continue
    }

    Write-LauncherStatus "Stopping stale AiDevEngine process PID $processId"
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}

function Wait-AiDevEngineReady {
  $deadline = (Get-Date).AddSeconds($MaxWaitSeconds)
  while ((Get-Date) -lt $deadline) {
    $probe = Invoke-AiDevEngineHealthProbe
    if ($probe.Ok -and (Test-AiDevEngineHealthy -HealthBody $probe.Body -StatusCode $probe.StatusCode)) {
      if (Test-AiDevEngineRegistryReady) {
        $count = $probe.Body.projectCount
        $active = $probe.Body.activeProjectCount
        $path = $probe.Body.registryPath
        Write-LauncherStatus "PROJECT_REGISTRY_LOADED count=$count active=$active path=$path"
        return $true
      }
    }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Start-AiDevEngineDevServer {
  Write-LauncherStatus "Starting npm run dev in a dedicated runtime window..."
  $command = "Set-Location '$RepoRoot'; npm run dev"
  Start-Process powershell -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $command) | Out-Null
}

function Test-LauncherScriptReady {
  $null = Get-Command Write-LauncherStatus
  $null = Get-Command Get-Port4321Owners
  $null = Get-Command Stop-StaleAiDevEngineListeners
  $null = Get-Command Wait-AiDevEngineReady
  return $true
}

Set-Location $RepoRoot

if ($HealthCheckOnly) {
  if (-not (Test-LauncherScriptReady)) {
    Write-LauncherStatus "Launcher script self-check failed."
    exit 1
  }
  Write-LauncherStatus "Launcher script parse and function check passed."
  exit 0
}

Write-LauncherStatus "Local Runtime Launcher V1"
Write-LauncherStatus "Repository: $RepoRoot"
Write-LauncherStatus "Checking port $Port..."

$owners = Get-Port4321Owners
if ($owners.Listening) {
  Write-LauncherStatus "Port $Port is in use - probing health..."
  $probe = Invoke-AiDevEngineHealthProbe
  if ($probe.Ok -and (Test-AiDevEngineHealthy -HealthBody $probe.Body -StatusCode $probe.StatusCode) -and (Test-AiDevEngineRegistryReady)) {
    Write-LauncherStatus "Healthy AiDevEngine runtime already running."
    if (-not $NoBrowser) {
      Start-Process $BaseUrl | Out-Null
    }
    exit 0
  }

  Write-LauncherStatus "Stale or unhealthy AiDevEngine runtime detected."
  if ($owners.IntendedAiDevEngine) {
    Stop-StaleAiDevEngineListeners -Owners $owners
    Start-Sleep -Seconds 2
  } else {
    Write-LauncherStatus "Port $Port is occupied by another application. Free the port or change FOUNDER_REALITY_PORT."
    exit 1
  }
}

Start-AiDevEngineDevServer

Write-LauncherStatus "Waiting for /api/brain/health and /api/projects/registry.json..."
if (-not (Wait-AiDevEngineReady)) {
  Write-LauncherStatus "AiDevEngine failed to become ready within $MaxWaitSeconds seconds."
  Write-LauncherStatus "Check the runtime window for REGISTRY_BOOTSTRAP_FAILED or port errors."
  exit 1
}

Write-LauncherStatus "Runtime ready - opening Command Center at $BaseUrl"
if (-not $NoBrowser) {
  Start-Process $BaseUrl | Out-Null
}

exit 0
