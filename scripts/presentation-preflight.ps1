$ErrorActionPreference = 'Stop'

$checks = New-Object System.Collections.Generic.List[Object]

function Add-Check {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$Detail
    )

    $status = if ($Passed) { 'PASS' } else { 'FAIL' }
    $checks.Add([PSCustomObject]@{
        Check = $Name
        Status = $status
        Detail = $Detail
    }) | Out-Null
}

Write-Host "Taylor's App Presentation Preflight" -ForegroundColor Cyan
Write-Host "----------------------------------"

$root = Get-Location
$requiredFiles = @(
    'index.html',
    'package.json',
    'src/App.jsx',
    'src/pages/LoginPage.jsx',
    'src/pages/Profile.jsx'
)

foreach ($file in $requiredFiles) {
    $exists = Test-Path -Path (Join-Path $root $file)
    Add-Check -Name "Required file: $file" -Passed $exists -Detail ($(if ($exists) { 'Found' } else { 'Missing' }))
}

$nodeOk = $false
$nodeVersion = ''
try {
    $nodeVersion = (& node --version).Trim()
    $nodeOk = $true
} catch {
    $nodeOk = $false
}
Add-Check -Name 'Node.js available' -Passed $nodeOk -Detail ($(if ($nodeOk) { $nodeVersion } else { 'node command not found' }))

$npmOk = $false
$npmVersion = ''
try {
    $npmVersion = (& npm --version).Trim()
    $npmOk = $true
} catch {
    $npmOk = $false
}
Add-Check -Name 'npm available' -Passed $npmOk -Detail ($(if ($npmOk) { $npmVersion } else { 'npm command not found' }))

$buildOk = $false
$buildLog = ''
try {
    $buildOutput = & npx.cmd vite build 2>&1
    $buildLog = ($buildOutput | Out-String)
    $buildOk = ($LASTEXITCODE -eq 0)
} catch {
    $buildLog = $_.Exception.Message
    $buildOk = $false
}

$logDir = Join-Path $root 'preflight'
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}
$buildLogPath = Join-Path $logDir 'last-build.log'
$buildLog | Out-File -FilePath $buildLogPath -Encoding utf8

Add-Check -Name 'Production build' -Passed $buildOk -Detail ($(if ($buildOk) { "Success (log: $buildLogPath)" } else { "Failed (log: $buildLogPath)" }))

$distExists = Test-Path -Path (Join-Path $root 'dist/index.html')
Add-Check -Name 'dist output exists' -Passed $distExists -Detail ($(if ($distExists) { 'dist/index.html found' } else { 'Missing dist/index.html' }))

$deployConfigExists = (Test-Path (Join-Path $root 'vercel.json')) -or (Test-Path (Join-Path $root 'netlify.toml'))
Add-Check -Name 'Deployment config' -Passed $deployConfigExists -Detail ($(if ($deployConfigExists) { 'Found vercel.json or netlify.toml' } else { 'No deployment config found' }))

$allPassed = ($checks | Where-Object { $_.Status -eq 'FAIL' }).Count -eq 0

$reportPath = Join-Path $logDir 'presentation-preflight-report.txt'
@(
    "Taylor's App Presentation Preflight Report"
    "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    ""
    ($checks | Format-Table -AutoSize | Out-String)
) | Out-File -FilePath $reportPath -Encoding utf8

$checks | Format-Table -AutoSize
Write-Host ""
Write-Host "Report saved to: $reportPath"
Write-Host "Build log saved to: $buildLogPath"

if (-not $allPassed) {
    Write-Host ""
    Write-Host 'Preflight completed with FAIL items.' -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host 'Preflight completed successfully.' -ForegroundColor Green
exit 0
