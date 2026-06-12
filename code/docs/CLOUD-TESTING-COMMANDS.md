# K6 Cloud Multi-Location Testing - Command Reference

## Prerequisites

### 1. Install k6
```powershell
# Option A: Using winget (Windows Package Manager)
winget install k6

# Option B: Using Chocolatey
choco install k6

# Option C: Direct download
# Visit: https://k6.io/docs/getting-started/installation/
```

### 2. Set up K6 Cloud Token
```powershell
# Get your token from: https://app.k6.io/ → Settings → API Tokens

# Temporary (current session only)
$env:K6_CLOUD_TOKEN = "your-token-here"

# Permanent (all future sessions)
[Environment]::SetEnvironmentVariable("K6_CLOUD_TOKEN", "your-token-here", "User")

# Verify it's set
echo $env:K6_CLOUD_TOKEN
```

---

## Quick Commands

### Test Current Zone (Default: US Ashburn)
```powershell
k6 cloud StressTestCloud.js
```
Runs ~30 minutes with 100 peak VUs from US East

---

### Test Different Single Zone
Edit `StressTestCloud.js` line 128-150, uncomment ONE zone:

```powershell
# Edit the file in your editor, then run:
k6 cloud StressTestCloud.js
```

---

### Test All Zones Sequentially (Workaround for Free Tier)
```powershell
# Run the automation script
.\run-cloud-tests-by-location.ps1
```
Runs test once per zone, ~6.5+ hours total (20 zones × 30 min each)

---

## 🌍 Load Zones Available (20 Global Zones)

### North America (5 zones)
| Zone Code | Location | Test Command |
|-----------|----------|--------------|
| `amazon:us:ashburn` | US East (N. Virginia) | Default ✓ |
| `amazon:us:columbus` | US Central (Ohio) | Edit StressTestCloud.js |
| `amazon:us:palo alto` | US West (California) | Edit StressTestCloud.js |
| `amazon:us:portland` | US West (Oregon) | Edit StressTestCloud.js |
| `amazon:ca:montreal` | Canada (Montreal) | Edit StressTestCloud.js |

### South America (1 zone)
| Zone Code | Location | Test Command |
|-----------|----------|--------------|
| `amazon:br:sao paulo` | Brazil (São Paulo) | Edit StressTestCloud.js |

### Europe (6 zones)
| Zone Code | Location | Test Command |
|-----------|----------|--------------|
| `amazon:ie:dublin` | Ireland (Dublin) | Edit StressTestCloud.js |
| `amazon:gb:london` | UK (London) | Edit StressTestCloud.js |
| `amazon:de:frankfurt` | Germany (Frankfurt) | Edit StressTestCloud.js |
| `amazon:fr:paris` | France (Paris) | Edit StressTestCloud.js |
| `amazon:se:stockholm` | Sweden (Stockholm) | Edit StressTestCloud.js |
| `amazon:it:milan` | Italy (Milan) | Edit StressTestCloud.js |

### Africa (1 zone)
| Zone Code | Location | Test Command |
|-----------|----------|--------------|
| `amazon:sa:cape town` | South Africa (Cape Town) | Edit StressTestCloud.js |

### Asia Pacific (8 zones)
| Zone Code | Location | Test Command |
|-----------|----------|--------------|
| `amazon:in:mumbai` | India (Mumbai) | Edit StressTestCloud.js |
| `amazon:cn:hong kong` | Hong Kong | Edit StressTestCloud.js |
| `amazon:sg:singapore` | Singapore | Edit StressTestCloud.js |
| `amazon:kr:seoul` | South Korea (Seoul) | Edit StressTestCloud.js |
| `amazon:jp:tokyo` | Japan (Tokyo) | Edit StressTestCloud.js |
| `amazon:jp:osaka` | Japan (Osaka) | Edit StressTestCloud.js |
| `amazon:au:sydney` | Australia (Sydney) | Edit StressTestCloud.js |

---

## How to Switch Zones

### Step 1: Open StressTestCloud.js
```powershell
code StressTestCloud.js
```

### Step 2: Find the Distribution Section (lines 128-150)
```javascript
distribution: {
  "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 100 },
  // ... other zones commented out
}
```

### Step 3: Comment Out Current Zone
```javascript
// "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 100 },
```

### Step 4: Uncomment New Zone
```javascript
"amazon:ie:dublin": { loadZone: "amazon:ie:dublin", percent: 100 },
```

### Step 5: Run Test
```powershell
k6 cloud StressTestCloud.js
```

---

## Subscription Tier Information

| Feature | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Zones Per Test | 1 | Unlimited |
| Distribution | Sequential or manual | Simultaneous |
| Test Duration | 30 min max | Unlimited |
| Peak VUs | 100 | 10,000+ |
| Cost | $0 | $99+/month |

---

## Troubleshooting

**Error: "Requested number of load zones not allowed (6 > max of 1)"**
```
→ You're on Free Tier. Uncomment only ONE zone in the distribution.
```

**Error: "Invalid zone code"**
```
→ Check spelling. Use exact zone codes from table above.
→ Example: "amazon:ie:dublin" (not "amazon:ie:ireland")
```

**Test runs but URL extraction fails**
```
→ This is a known issue with regex pattern matching.
→ Results still complete and appear in k6 Cloud dashboard.
→ Find them at: https://app.k6.io/projects/3831097/runs
```

---


---

## View Results in k6 Cloud Dashboard

### Step 1: Navigate to k6 Cloud
- Go to: https://app.k6.io/
- Sign in to your account

### Step 2: View Test Runs
- Click **"Runs"** in the left menu
- You'll see all your test executions listed

### Step 3: Analyze Results per Location
- Click on any run to view detailed metrics:
  - **Response Times**: By endpoint and region
  - **Throughput**: Requests per second
  - **Error Rates**: Status codes and failures
  - **Performance Timeline**: Response time over test duration
  - **Geographic Breakdown**: Metrics by load zone

### Step 4: Compare Locations
- View metrics side-by-side across regions
- Identify performance bottlenecks by geography
- Export data for reporting

---

## Example: Test Specific Regions Only

Edit `StressTestCloud.js` and change the distribution section:

### Test US East + Europe Only
```javascript
distribution: {
  "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 50 },
  "amazon:ie:dublin":  { loadZone: "amazon:ie:dublin",  percent: 50 }
}
```

### Test Asia-Pacific Regions Only
```javascript
distribution: {
  "amazon:sg:singapore": { loadZone: "amazon:sg:singapore", percent: 33 },
  "amazon:jp:tokyo":     { loadZone: "amazon:jp:tokyo",     percent: 33 },
  "amazon:au:sydney":    { loadZone: "amazon:au:sydney",    percent: 34 }
}
```

---

## Quick Troubleshooting

### Error: "K6_CLOUD_TOKEN not set"
```powershell
$env:K6_CLOUD_TOKEN = "your-token-from-app.k6.io"
```

### Error: "Free tier only allows 1 load zone"
→ Upgrade to k6 Cloud paid plan to use multi-region testing

### How to get more detailed per-location metrics
→ Use the k6 Cloud dashboard's **"By Tag"** filtering:
- Metrics → Tags → Select "region" tag
- View breakdown by region

### Export results for external analysis
→ In k6 Cloud dashboard:
1. Click the run
2. Scroll to **"Metrics"**
3. Click **"Export"** → Download as JSON/CSV

---

## Key Metrics to Monitor by Location

| Metric | Ideal | Warning | Critical |
|--------|-------|---------|----------|
| **Response Time (p95)** | < 500ms | 500-2000ms | > 2000ms |
| **Error Rate** | < 0.5% | 0.5-2% | > 2% |
| **Throughput** | Consistent | ±10% variance | >20% variance |
| **Connection Time** | < 100ms | 100-300ms | > 300ms |

---

## Running Tests Regularly

### Schedule with Windows Task Scheduler
```powershell
# Create a scheduled task to run tests daily at 2 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$action = New-ScheduledTaskAction -Execute "pwsh.exe" -Argument "-File C:\path\to\run-cloud-tests-by-location.ps1"
Register-ScheduledTask -TaskName "K6-CloudTests" -Trigger $trigger -Action $action -RunLevel Highest
```

---

## More Information

- **k6 Docs**: https://k6.io/docs/
- **k6 Cloud Guide**: https://k6.io/docs/cloud/
- **Load Zones**: https://k6.io/docs/cloud/load-zones/
- **Threshold Setting**: https://k6.io/docs/using-k6/thresholds/
