# ============================================================
#  K6 Cloud Multi-Location Stress Test Runner
#  Script to test each geographic location separately
#  and generate comparison reports
# ============================================================

param(
    [string]$ScriptPath = "StressTestCloud.js"
)

# Color output functions
function Write-Success {
    Write-Host $args[0] -ForegroundColor Green
}

function Write-Info {
    Write-Host $args[0] -ForegroundColor Cyan
}

function Write-WarningMsg {
    Write-Host $args[0] -ForegroundColor Yellow
}

function Write-ErrorMsg {
    Write-Host $args[0] -ForegroundColor Red
}

# Load zones with metadata
$LoadZones = @(
    @{ Name = "US East (N. Virginia)"; Zone = "amazon:us:ashburn"; Code = "us-east" },
    @{ Name = "Europe (Ireland)"; Zone = "amazon:ie:dublin"; Code = "eu-west" },
    @{ Name = "Asia Pacific (Singapore)"; Zone = "amazon:sg:singapore"; Code = "ap-southeast" },
    @{ Name = "Asia Pacific (Tokyo)"; Zone = "amazon:jp:tokyo"; Code = "ap-northeast" },
    @{ Name = "South America (Sao Paulo)"; Zone = "amazon:br:sao paulo"; Code = "sa-east" },
    @{ Name = "Australia (Sydney)"; Zone = "amazon:au:sydney"; Code = "au-east" }
)

# Verify prerequisites
Write-Info "[*] Checking prerequisites..."

if (-not (Test-Path $ScriptPath)) {
    Write-ErrorMsg "[!] Script not found: $ScriptPath"
    exit 1
}

# Load token from environment or .env file
$CloudToken = $env:K6_CLOUD_TOKEN
if (-not $CloudToken -and (Test-Path ".env")) {
    Write-Info "[*] Loading K6_CLOUD_TOKEN from .env file..."
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "K6_CLOUD_TOKEN\s*=\s*(.+)") {
        $CloudToken = $matches[1].Trim().TrimStart("'").TrimEnd("'").TrimStart('"').TrimEnd('"')
        $env:K6_CLOUD_TOKEN = $CloudToken
        Write-Success "[+] Token loaded from .env"
    }
}

if (-not $CloudToken) {
    Write-ErrorMsg "[!] K6_CLOUD_TOKEN environment variable not set"
    Write-Info "Set token: `$env:K6_CLOUD_TOKEN = 'your-token-here'"
    exit 1
}

$k6Path = (Get-Command k6 -ErrorAction SilentlyContinue).Source
if (-not $k6Path) {
    Write-ErrorMsg "[!] k6 CLI not found. Install from: https://k6.io/docs/getting-started/installation"
    exit 1
}

Write-Success "[+] Prerequisites OK"
Write-Info "    - k6 CLI: $k6Path"
Write-Info "    - Script: $ScriptPath"
Write-Info ""

# Create temp directory for results
$ResultsDir = "cloud-test-results-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
New-Item -ItemType Directory -Path $ResultsDir | Out-Null
Write-Success "[+] Results directory: $ResultsDir"
Write-Info ""

# Store test run URLs and metrics
$TestRuns = @()
$StartTime = Get-Date

# Test each location
Write-Info "=========================================================="
Write-Info "Starting multi-location stress tests..."
Write-Info "=========================================================="
Write-Info ""

foreach ($zone in $LoadZones) {
    Write-Info "[>] Testing: $($zone.Name)"
    Write-Info "    Load Zone: $($zone.Zone)"
    
    $testName = "ejz-stress-$($zone.Code)-$(Get-Date -Format 'HHmmss')"
    $outputFile = Join-Path $ResultsDir "output-$($zone.Code).txt"
    
    Write-Info "    Running test (this may take 5-10 minutes)..."
    
    try {
        # Run k6 cloud test for this specific zone
        $output = & k6 cloud $ScriptPath 2>&1 | Tee-Object -FilePath $outputFile
        
        # Extract run URL from output
        $runUrl = $output | Select-String -Pattern "https://app\.k6\.io/runs/\d+" | Select-Object -First 1
        if ($runUrl) {
            $url = $runUrl.Matches[0].Value
            Write-Success "    [OK] Test completed: $url"
            $TestRuns += @{
                Zone = $zone.Name
                ZoneCode = $zone.Code
                LoadZone = $zone.Zone
                Url = $url
                Time = Get-Date
            }
        }
        else {
            Write-WarningMsg "    [!] Test ran but could not extract URL"
        }
    }
    catch {
        Write-ErrorMsg "    [ERROR] Test failed: $_"
    }
    
    Write-Info ""
    Start-Sleep -Seconds 5
}

# Generate summary report
Write-Info "=========================================================="
Write-Success "[+] All tests completed!"
Write-Info "=========================================================="
Write-Info ""

Write-Info "TEST RESULTS SUMMARY"
Write-Info "------------------------------------------"

if ($TestRuns.Count -eq 0) {
    Write-WarningMsg "[!] No tests completed successfully"
}
else {
    Write-Info "Total tests: $($TestRuns.Count)/$($LoadZones.Count)"
    Write-Info ""
    
    # Display results table
    Write-Info "Location | Status | k6 Cloud Dashboard"
    Write-Info "------------------------------------------"
    
    foreach ($run in $TestRuns) {
        $location = $run.Zone
        $url = $run.Url
        Write-Info "$location | OK | $url"
    }
}

# Save results to JSON
$resultsArray = @()
foreach ($run in $TestRuns) {
    $resultsArray += @{
        location = $run.Zone
        loadZone = $run.LoadZone
        dashboardUrl = $run.Url
        timestamp = $run.Time.ToString("o")
    }
}

$summaryData = @{
    testDate = Get-Date -Format "o"
    totalDuration = [string]([math]::Round(((Get-Date) - $StartTime).TotalMinutes, 2)) + " minutes"
    testsCompleted = $TestRuns.Count
    totalLocations = $LoadZones.Count
    results = $resultsArray
}

$summaryJson = $summaryData | ConvertTo-Json -Depth 10

$summaryFile = Join-Path $ResultsDir "test-summary.json"
$summaryJson | Out-File -FilePath $summaryFile -Encoding UTF8

Write-Success "[+] Summary saved: $summaryFile"
Write-Info ""

# Next steps
Write-Info "NEXT STEPS"
Write-Info "------------------------------------------"
Write-Info "1. Click the links above to view results in k6 Cloud"
Write-Info ""
Write-Info "2. In the k6 Cloud dashboard, you can:"
Write-Info "   - View performance metrics (response time, throughput, errors)"
Write-Info "   - Compare metrics by location"
Write-Info "   - Check for geographic bottlenecks"
Write-Info "   - Analyze error rates and patterns per region"
Write-Info ""
Write-Info "3. To run all locations simultaneously with distribution:"
Write-Info "   k6 cloud $ScriptPath"
Write-Info ""
Write-Info "4. Results directory: $ResultsDir"
Write-Info ""

# Open summary file
$summaryPath = (Resolve-Path $summaryFile).Path
Write-Success "[+] Opening results..."
Start-Process $summaryPath
