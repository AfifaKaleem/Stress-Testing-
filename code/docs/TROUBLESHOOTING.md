# 🐛 Troubleshooting Guide

## Installation Issues

### ❌ "command not found: k6"

**Fix:**
```bash
# macOS
brew install k6

# Linux (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y gnupg2 curl
curl https://dl.k6.io/apt/linux.gpg | sudo apt-key add -
echo "deb https://dl.k6.io/apt debian main" | sudo tee /etc/apt/sources.list.d/k6-stable.list
sudo apt-get update && sudo apt-get install -y k6

# Linux (Fedora/RHEL)
sudo dnf install -y k6

# Windows (PowerShell as Admin)
winget install k6
# OR
choco install k6

# Verify installation
k6 version
```

---

### ❌ "Permission denied" on Linux/macOS

**Fix:**
```bash
# Make script executable
chmod +x stress-test-ejz.js

# Or run with explicit k6
k6 run stress-test-ejz.js
```

---

## Connectivity Issues

### ❌ "Get http://target-url: dial tcp: lookup target-url: no such host"

**Cause:** URL is invalid or unreachable

**Fix:**
```bash
# Test URL is reachable
curl -I https://ejz-frontend.vercel.app

# Run test with correct URL
k6 run -e TARGET_URL=https://ejz-frontend.vercel.app stress-test-ejz.js

# Test with verbose output
k6 run -v stress-test-ejz.js

# Test with HTTP debugging
k6 run --http-debug stress-test-ejz.js
```

---

### ❌ "SSL: CERTIFICATE_VERIFY_FAILED"

**Cause:** SSL certificate verification failing (self-signed cert, proxy, etc.)

**Fix:**
```bash
# Option 1: Skip verification (for testing only!)
k6 run --insecure-skip-tls-verify stress-test-ejz.js

# Option 2: Edit script to add insecure flag
# In stress-test-ejz.js export options:
// insecureSkipTLSVerify: true,   // ← Uncomment this line
```

---

### ❌ "Connection refused: 127.0.0.1:3000"

**Cause:** Target server not running or wrong host/port

**Fix:**
```bash
# Check if target is running
curl https://ejz-frontend.vercel.app

# For local development servers
# Make sure your local dev server is running first!
npm start    # or your dev command

# Verify it's accessible
curl http://localhost:3000

# Then run test
k6 run -e TARGET_URL=http://localhost:3000 stress-test-ejz.js
```

---

## Resource Issues

### ❌ "memory exceeded" or Out of Memory error

**Cause:** VU count too high for machine resources

**Fix:**
```bash
# Reduce peak VU count
k6 run -e MAX_VUS=500 stress-test-ejz.js

# Use smaller test stages
# Edit stages in stress-test-ejz.js to reduce duration/VUs

# Use k6 Cloud instead (no local resources)
k6 cloud stress-test-ejz.js
```

**Check system resources:**
```bash
# macOS/Linux: Check available RAM
free -h    # Linux
vm_stat    # macOS

# Windows PowerShell
Get-WmiObject Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory
```

---

### ❌ "File descriptor limit exceeded" / "too many open files"

**Cause:** System has limit on open connections

**Fix (Linux/macOS):**
```bash
# Check current limit
ulimit -n

# Increase limit (temporary)
ulimit -n 65536

# Make permanent (Linux):
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
sudo reboot

# Then run test
k6 run stress-test-ejz.js
```

**Fix (Windows):**
Usually not an issue, but if you get this:
```bash
# Restart PowerShell as Administrator and try again
```

---

## Script/Syntax Issues

### ❌ "Unexpected token" or "Syntax Error"

**Cause:** JavaScript syntax error in script

**Fix:**
```bash
# Run with verbose output to see exact error
k6 run -v stress-test-ejz.js

# Check for common issues:
# - Missing semicolons
# - Mismatched braces {}
# - Typos in variable names
# - Missing commas in objects

# Use online JS validator if unsure
# https://jshint.com
```

---

### ❌ "module not found: k6/http"

**Cause:** Script trying to import module that doesn't exist

**Fix:**
```bash
# Ensure you're using correct k6 imports:
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Gauge, Rate, Trend } from "k6/metrics";

# Not:
import http from "http";  // ← WRONG
```

---

### ❌ "undefined function: getRegionHeaders"

**Cause:** Function not defined before being called

**Fix:**
```bash
# Ensure function is defined BEFORE export default function()
function getRegionHeaders() {
  // ... function body
}

// THEN define export default
export default function() {
  // ... can now use getRegionHeaders()
}
```

---

## Test Execution Issues

### ❌ "Test failed: threshold 'login_success_rate' not met"

**This means:** Server didn't pass the performance threshold

**Investigate:**
```bash
# Check server logs for errors
tail -f /var/log/app.log

# Check if server is overwhelmed
# - CPU usage high?
# - Memory usage high?
# - Database connections maxed?
# - Port/rate limiting triggered?

# Run with lower VU count to verify
k6 run -e MAX_VUS=100 stress-test-ejz.js

# If that passes, server can't handle full load
# → Need to scale up or optimize server

# If that also fails, there's a functional issue
# → Check server code/logs
```

---

### ❌ "All stages passed, but errors reported"

**Fix:**
```bash
# Detailed error breakdown
k6 run --out json=results.json stress-test-ejz.js

# Parse JSON to see which endpoints failed
# Look for "error_count" per phase

# Run individual endpoint test
# Edit script to only test one journey at a time

# Run with HTTP debugging to see responses
k6 run --http-debug stress-test-ejz.js
```

---

### ❌ "High error rate during spike phase only"

**This is normal!** Spike tests the breaking point.

**Fix:**
```bash
# Check if it recovers after spike ends
# - If errors drop to 0% → server handles it fine
# - If errors persist → server crashed, needs restart

# Monitor server during test
# - Open separate terminal
# - Watch logs: tail -f logs.txt
# - Watch metrics: watch -n 1 'ps aux | grep node'

# If server crashes:
# 1. Restart server
# 2. Reduce MAX_VUS
# 3. Check autoscaling policies
```

---

### ❌ "Inconsistent results on same test"

**Cause:** Network latency, server variance, or traffic

**Fix:**
```bash
# Run test multiple times and average results
k6 run --out json=run1.json stress-test-ejz.js
k6 run --out json=run2.json stress-test-ejz.js
k6 run --out json=run3.json stress-test-ejz.js

# Average the three runs

# For production testing, use k6 Cloud for stable results
k6 cloud stress-test-ejz.js
```

---

## Docker/Compose Issues

### ❌ "Cannot connect to Docker daemon"

**Fix:**
```bash
# Start Docker
# macOS:
open -a Docker

# Linux:
sudo systemctl start docker

# Windows: Start Docker Desktop
```

---

### ❌ "docker compose: command not found"

**Fix:**
```bash
# Docker Compose v2 installation:
# macOS:
brew install docker-compose

# Linux:
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Windows: Included with Docker Desktop

# Verify:
docker-compose --version
```

---

### ❌ "Grafana not accessible at localhost:3000"

**Fix:**
```bash
# Check if containers are running
docker ps

# Check logs
docker logs ejz-grafana

# Restart containers
docker-compose down
docker-compose up -d grafana influxdb

# Wait 10 seconds for startup
sleep 10

# Try again
curl http://localhost:3000
```

**Default credentials:**
- Username: `admin`
- Password: `admin`

---

### ❌ "InfluxDB connection error"

**Fix:**
```bash
# Check InfluxDB is running
docker ps | grep influxdb

# Check container logs
docker logs ejz-influxdb

# Test connection
curl -I http://localhost:8086/ping

# Restart
docker-compose restart influxdb

# Recreate database if needed
docker exec ejz-influxdb influx -execute "CREATE DATABASE k6"
```

---

## Performance Issues

### ❌ "Test running but very slow / taking too long"

**Cause:** Server slow, network latency, or insufficient resources

**Fix:**
```bash
# Check response times in real-time
k6 run -v stress-test-ejz.js | grep "http_req_duration"

# Check which endpoint is slow
k6 run --out json=results.json stress-test-ejz.js
# Then examine results.json for slow requests

# Reduce test scope for debugging
k6 run --stage '1m:100' --stage '1m:0' stress-test-ejz.js

# Check network connectivity
ping ejz-frontend.vercel.app
curl -w "\nTotal time: %{time_total}s\n" https://ejz-frontend.vercel.app/login
```

---

### ❌ "Some VUs hang/don't complete"

**Fix:**
```bash
# Add timeout to requests
# Edit script to add in options:
httpDebug: "full",  // See what's hanging

# Or set request timeout
http.get(url, {
  headers,
  timeout: "30s",   // ← Add this
});

# If server is unresponsive:
# 1. Check server status
# 2. Reduce MAX_VUS
# 3. Increase think-time between requests
```

---

## Analysis Issues

### ❌ "HTML report won't open"

**Fix:**
```bash
# File should be generated as ejz-stress-report-[timestamp].html
ls -la *.html

# Open directly in browser
open ejz-stress-report-*.html    # macOS
xdg-open ejz-stress-report-*.html # Linux
start ejz-stress-report-*.html    # Windows

# Or view in browser
python3 -m http.server 8000
# Then visit http://localhost:8000
```

---

### ❌ "JSON results file is empty or corrupted"

**Fix:**
```bash
# Try JSON format
k6 run --out json=results.json stress-test-ejz.js

# Verify file isn't empty
wc -l results.json

# Try with text output instead
k6 run stress-test-ejz.js > output.txt 2>&1
cat output.txt
```

---

## K6 Cloud Issues

### ❌ "Error: Requested number of load zones not allowed (6 > max of 1)"

**Cause:** You're on Free Tier; only 1 zone allowed per test

**Fix:**
```bash
# Edit StressTestCloud.js and uncomment ONLY ONE zone

# Lines 128-150: Keep only one zone uncommented
distribution: {
  "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 100 },
  // Comment out all others
  // "amazon:ie:dublin": { loadZone: "amazon:ie:dublin", percent: 100 },
}

# Then run again
k6 cloud StressTestCloud.js
```

**Upgrade to Paid Tier:**
- Go to https://app.k6.io/account/billing
- Paid tier ($99+/month) allows unlimited zones

**Workaround for testing all zones on Free Tier:**
```bash
# Run the PowerShell automation script
.\run-cloud-tests-by-location.ps1

# This tests each zone sequentially (one at a time)
# ~30 minutes per zone × 20 zones = ~10 hours total
```

---

### ❌ "Error: Cloud token not set or invalid"

**Fix:**
```bash
# Set token temporarily (current session)
$env:K6_CLOUD_TOKEN = "your-token-here"

# Or set permanently
[Environment]::SetEnvironmentVariable("K6_CLOUD_TOKEN", "your-token-here", "User")

# Verify it's set
echo $env:K6_CLOUD_TOKEN

# Get token from: https://app.k6.io/account/tokens
```

---

### ❌ "Test runs but can't extract k6 Cloud URL"

**This is a known issue** - regex pattern may not match all k6 output formats

**Workaround:**
```bash
# Find results manually at:
# https://app.k6.io/projects/3831097/runs

# Or check PowerShell script output for URL pattern:
# Look for "https://app.k6.io/runs/..."
```

---

### ❌ "Test exceeds cloud limits"

**Causes:**
- Peak VU count too high (>100 on Free, >10k on Paid)
- Test duration too long (>30 min on Free)
- Too many custom metrics

**Fix:**
```bash
# Reduce peak VUs in stages array
stages: [
  { duration: "2m", target: 50 },   // ← Reduce from 100
  { duration: "3m", target: 50 },
  { duration: "2m", target: 0 },
]

# Or reduce test duration
{ duration: "20m", target: 50 },   // ← Reduce from 30m
```

---

### ❌ "Timeout waiting for test to start on k6 Cloud"

**Fix:**
```bash
# Check your k6 Cloud subscription is active
# Visit: https://app.k6.io/account/billing

# Check project ID is correct
# In StressTestCloud.js line 122:
projectID: 3831097,    // Verify this matches your project

# Try again with explicit project
k6 cloud -p 3831097 StressTestCloud.js
```

---

## Getting Help

### Collect debugging info before asking for help:

```bash
# Generate debug bundle
k6 run -v --http-debug --out json=debug-results.json stress-test-ejz.js 2>&1 | tee debug-log.txt

# Collect system info
uname -a > system-info.txt
k6 version >> system-info.txt
docker -v >> system-info.txt 2>&1

# Check target availability
curl -v https://ejz-frontend.vercel.app/login > connectivity-test.txt 2>&1

# Share these files when asking for help:
# - debug-log.txt
# - debug-results.json
# - system-info.txt
# - connectivity-test.txt
```

### Resources

- [k6 Documentation](https://k6.io/docs)
- [k6 Community Slack](https://k6.io/slack)
- [k6 GitHub Issues](https://github.com/grafana/k6/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/k6)

---

**Still stuck? Enable maximum verbosity:**
```bash
k6 run -vv --http-debug stress-test-ejz.js 2>&1 | head -500
```

This will show you exactly what's happening at each step!
