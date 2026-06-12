# 📋 EJZ Frontend Stress Testing Suite — Complete Package

## ✅ What You Have

A production-grade, multi-endpoint stress testing suite for **ejz-frontend.vercel.app** with:

- **100 peak concurrent users** (Cloud Free Tier — scalable with paid plan)
- **30-minute comprehensive test** (3 realistic user journeys)
- **20 global load zones** available (North America, South America, Europe, Africa, Asia Pacific)
- **4 critical endpoints** tested (register, login, billing pages)
- **Real-world user behavior** (registration, authentication, upsell flows)
- **Detailed performance metrics** and HTML/JSON reports
- **Docker + Grafana integration** for live dashboards

---

## 📁 Files in This Suite

### 1. **StressTestCloud.js** (K6 Cloud Test Script)
The production k6 stress testing script with:
- Multi-stage load profile (0→100 VUs over 30 minutes)
- Three concurrent user journeys (40/30/30 distribution)
- 20 global load zones (North America, Europe, Asia, Africa, South America)
- Custom metrics tracking
- Performance thresholds (SLOs)

**Size:** ~250 lines | **Status:** Ready to run on k6 Cloud

### 2. **stress-test-ejz.js** (Local Test Script)
Alternative for local testing with:
- Higher load (2000 peak VUs for detailed analysis)
- Longer duration (48 minutes)
- Simulated geographic regions with latency injection
- Same user journeys and metrics

**Size:** ~530 lines | **Status:** For advanced local testing

### 3. **README.md** (Comprehensive Documentation)
Complete reference with:
- Load profile breakdown (10 phases explained)
- All 20 global load zones listed by region
- User journey distribution (40/30/30 split)
- All metrics and thresholds explained
- Quick start for 3 different approaches (local, cloud, Docker)
- Advanced usage examples
- Subscription tier information
- Expected baseline results

### 4. **QUICK_START.md** (Fast Reference Guide)
8 immediate-use commands:
1. Start local test (stress-test-ejz.js)
2. K6 Cloud single zone (default: Free Tier)
3. K6 Cloud with different geographic zone
4. Quick 5-minute spike test
5. Export full results (JSON+HTML)
6. Live web dashboard
7. Custom configuration
8. Docker + Grafana stack

Plus subscription info, all 20 zones listed, and troubleshooting.

### 5. **ADVANCED_CONFIG.md** (Power User Guide)
For customization and extension:
- Environment variable reference
- K6 Cloud zone configuration (Free Tier vs Paid Tier)
- How to modify test stages
- Changing user journey distribution
- Modifying SLO thresholds
- Docker configuration tweaks
- CI/CD integration templates
- Multi-zone setup examples

### 6. **CLOUD-TESTING-COMMANDS.md** (K6 Cloud Reference)
Complete cloud testing guide:
- Cloud token setup
- Quick commands for different zones
- All 20 zones with zone codes and locations
- How to switch between zones
- Subscription tier comparison
- Troubleshooting cloud-specific issues

### 7. **TROUBLESHOOTING.md** (Problem Solver)
Solutions for common issues:
- Installation problems
- Connectivity issues
- Resource constraints
- Syntax errors
- Test execution problems
- K6 Cloud subscription errors
- Docker issues
- Performance problems
- Analysis/reporting problems
- Debug information collection

### 8. **docker-compose.yml** (Infrastructure)
Pre-configured stack:
- **InfluxDB** — Time-series metrics database
- **Grafana** — Beautiful live dashboard
- **k6** — Load generator service

One command to spin up the entire monitoring stack.

---

## 🚀 Getting Started (3 Steps)

### Step 1: Install k6 (One-time)
```bash
# macOS
brew install k6

# Linux
sudo snap install k6

# Windows (Admin)
winget install k6
```

### Step 2: Pick Your Test Mode

**Option A: K6 Cloud (Free Tier) — Recommended**
```bash
export K6_CLOUD_TOKEN=your-token-here
k6 cloud StressTestCloud.js
```
[Get token from https://app.k6.io/account/tokens](https://app.k6.io/account/tokens)

**Option B: Local Test (Advanced)**
```bash
k6 run stress-test-ejz.js
```

**Option C: Local with Live Dashboard**
```bash
k6 run --out web-dashboard stress-test-ejz.js
```

**Option D: Docker + Grafana**
```bash
docker compose up -d
docker compose run k6
```

### Step 3: Review Results
- Check console output (✓ = passing threshold)
- Open HTML report: `ejz-stress-report-[timestamp].html`
- Export to JSON: `--out json=results.json`

---

## 📊 Load Profile At a Glance

```
📈 RAMP UP (0-16 min, 0→1000 VUs)
  ├─ Warm-up: 0→200 VUs (3 min)
  ├─ Ramp: 200→500 VUs (4 min)
  ├─ Normal: 500 VUs steady (5 min)
  └─ Stress: 500→1000 VUs (4 min)

⚡ SPIKE TEST (16-23 min, 1000→2000 VUs)
  ├─ Ramp to peak: 1000→2000 (2 min)
  └─ Hold at peak: 2000 VUs (5 min)

📉 RECOVERY (23-30 min, 2000→1000 VUs)
  └─ Spike drop: 2000→1000 (2 min)

🔄 SOAK TEST (30-45 min, 1000 VUs steady)
  └─ Memory leak detection (15 min)

🛑 COOL DOWN (45-48 min, 1000→0 VUs)
  └─ Graceful shutdown (3 min)

Total: 48 minutes | Peak: 2000 VUs
```

---

## 👥 User Journeys Being Tested

### Journey 1: **New User Registration** (40% of VUs)
```
1. Load /register page
2. Submit registration with unique credentials
3. Load post-registration assets
4. Metric: Success rate, response time
```

### Journey 2: **Existing User Login** (30% of VUs)
```
1. Load /login page
2. Submit credentials (70% valid, 30% error paths)
3. Load dashboard assets
4. Metric: Success rate, auth response time
```

### Journey 3: **Billing & Upsell** (30% of VUs)
```
1. Load /billing?newUser=true OR /dashboard/billing (50/50)
2. Simulate plan selection & upgrade
3. Load billing assets
4. Metric: Page load time, billing success rate
```

---

## 📈 Key Metrics Tracked

| Metric | SLO | Importance |
|--------|-----|------------|
| `login_response_ms` | p95 < 3s | Critical |
| `register_response_ms` | p95 < 4s | High |
| `billing_response_ms` | p95 < 3s | High |
| `page_load_time_ms` | p95 < 5s | High |
| `http_req_failed` | < 5% | Critical |
| `login_success_rate` | > 85% | Critical |
| `register_success_rate` | > 80% | High |
| `http_req_duration` | p99 < 6s | Critical |

---

## 🌍 Geographic Regions (6 Locations)

| Region | Location | Latency | Traffic % |
|--------|----------|---------|-----------|
| `us-east-1` | US East (Virginia) | 20-80ms | 20% |
| `eu-west-1` | Europe (Ireland) | 80-180ms | 20% |
| `ap-southeast-1` | Asia (Singapore) | 120-260ms | 15% |
| `ap-northeast-1` | Asia (Tokyo) | 150-300ms | 15% |
| `sa-east-1` | South America (São Paulo) | 180-350ms | 15% |
| `me-south-1` | Middle East (Bahrain) | 100-220ms | 15% |

Each region gets realistic latency jitter + regional language preference headers.

---

## 🎯 Customization Options

All configurable via environment variables:

```bash
# Change peak VU count
-e MAX_VUS=5000

# Change target URL
-e TARGET_URL=https://staging.ejz.io

# Change test credentials
-e TEST_EMAIL=admin@test.com
-e TEST_PASS=MyPassword123!

# Example:
k6 run \
  -e TARGET_URL=https://staging.ejz.io \
  -e MAX_VUS=1000 \
  stress-test-ejz.js
```

Or edit the script directly for advanced modifications (see ADVANCED_CONFIG.md).

---

## 📊 Expected Results (Healthy Server)

Under normal conditions with 2000 peak VUs:

```
✅ Login success rate: 95%+
✅ Register success rate: 90%+
✅ Average response time: 300-600ms
✅ p95 response time: 1.5-2.5s
✅ Error rate: < 1%
✅ No crashes during spike
✅ Recovery after spike drop
```

---

## 🚨 Interpreting Results

### ✅ **GREEN** — Server Healthy
- All thresholds pass (✓ shown in console)
- Response times consistent across regions
- Success rates > 90%
- Recovers quickly from spike

### ⚠️ **YELLOW** — Needs Optimization
- Response times 3-5 seconds
- Success rates 80-90%
- Gradual performance degradation
- → Scale up resources or optimize code

### 🔴 **RED** — Critical Issues
- Response times > 5s
- Success rates < 80%
- Error rate > 5%
- Crash during spike phase
- → Immediate action required!

---

## 💾 Output Files Generated

After each test run, k6 creates:

```
ejz-stress-report-[timestamp].html    # Beautiful HTML report
ejz-stress-summary-[timestamp].json    # Detailed JSON metrics
```

Plus optional exports with flags:
- `--out json=results.json` → Detailed results
- `--out web-dashboard` → Live web dashboard
- `--out csv=results.csv` → CSV export
- `--out influxdb=...` → Send to InfluxDB

---

## 🔗 File Organization

```
your-workspace/
├── stress-test-ejz.js          ← Main test script (EDIT FOR CUSTOMIZATION)
├── README.md                   ← Full documentation
├── QUICK_START.md              ← 7 quick commands
├── ADVANCED_CONFIG.md          ← Advanced customization
├── TROUBLESHOOTING.md          ← Problem solutions
├── docker-compose.yml          ← Docker stack
├── ejz-stress-report-*.html    ← Generated reports
└── ejz-stress-summary-*.json   ← Generated metrics
```

---

## 🛠️ Next Steps

### 1. **Run Your First Test**
```bash
k6 run stress-test-ejz.js
```
Expected: ~48 minutes, generates 2 files

### 2. **Check the Results**
- Look for ✓ (pass) or ✗ (fail) indicators
- Open the HTML report
- Compare against expected baseline

### 3. **If Test Fails**
- Check TROUBLESHOOTING.md for your specific error
- Review server logs for the cause
- Reduce MAX_VUS for debugging
- Run again

### 4. **If Test Passes**
- 🎉 Congratulations! Server handles the load
- Run tests regularly (weekly/monthly)
- Save reports for trending

### 5. **Production Usage**
- Use k6 Cloud for real geo-distributed load (`k6 cloud stress-test-ejz.js`)
- Integrate into CI/CD pipeline
- Set up alerting based on thresholds
- Monitor server metrics during tests

---

## 📚 Quick Reference

| Task | Command |
|------|---------|
| Start test | `k6 run stress-test-ejz.js` |
| With results | `k6 run --out json=r.json stress-test-ejz.js` |
| Live dashboard | `k6 run --out web-dashboard stress-test-ejz.js` |
| Docker stack | `docker compose up -d && docker compose run k6` |
| Custom VUs | `k6 run -e MAX_VUS=500 stress-test-ejz.js` |
| Custom target | `k6 run -e TARGET_URL=http://localhost:3000 stress-test-ejz.js` |
| Cloud testing | `k6 cloud stress-test-ejz.js` |
| Debug mode | `k6 run -v --http-debug stress-test-ejz.js` |

---

## 🔄 Continuous Integration Example

Add to your GitHub Actions workflow:

```yaml
- name: Run K6 Stress Test
  run: |
    k6 run --out json=stress-results.json \
      -e TARGET_URL=https://ejz-frontend.vercel.app \
      stress-test-ejz.js
  
- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: stress-test-results
    path: stress-results.json
```

---

## 🎓 Learning Resources

- [k6 Documentation](https://k6.io/docs) — Official docs
- [k6 Best Practices](https://k6.io/docs/testing-guides/k6-best-practices/)
- [Load Testing Guide](https://k6.io/docs/testing-guides/)
- [GitHub Issues](https://github.com/grafana/k6/issues) — Help & examples
- [Stack Overflow](https://stackoverflow.com/questions/tagged/k6) — Community Q&A

---

## 📝 Documentation Map

| Document | Best For | Read Time |
|----------|----------|-----------|
| **QUICK_START.md** | Getting started immediately | 5 min |
| **README.md** | Understanding what's being tested | 10 min |
| **stress-test-ejz.js** | See actual test code | 15 min |
| **ADVANCED_CONFIG.md** | Customizing the test | 20 min |
| **TROUBLESHOOTING.md** | Solving problems | As needed |
| **docker-compose.yml** | Setting up monitoring | 5 min |

---

## ✨ Features Summary

✅ **2000 concurrent users** at peak load  
✅ **4 endpoints** tested simultaneously  
✅ **6 geographic regions** with latency simulation  
✅ **3 user journeys** (registration, login, billing)  
✅ **48-minute comprehensive test** including spike and soak phases  
✅ **Real user behavior** with think-time and error paths  
✅ **Detailed metrics** (page load, auth, billing, error tracking)  
✅ **Performance thresholds** (SLOs) with pass/fail indicators  
✅ **Beautiful reports** (HTML + JSON)  
✅ **Docker + Grafana** for live monitoring  
✅ **k6 Cloud ready** for production geo-distributed testing  
✅ **Fully configurable** via environment variables  
✅ **Production-ready** with error handling and recovery simulation  

---

## 🎉 You're All Set!

Everything is ready to test. Start with:

```bash
k6 run stress-test-ejz.js
```

Then check **QUICK_START.md** for more options, or **TROUBLESHOOTING.md** if issues arise.

**Questions?** See the appropriate document above or enable verbose mode:
```bash
k6 run -v stress-test-ejz.js
```

---

**Happy stress testing! 🚀**

*Last updated: May 6, 2026*
