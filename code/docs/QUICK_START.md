# 🚀 EJZ Stress Test — Quick Start Guide

## One-Line Test Commands

### 1️⃣ **Start Local Test NOW**
```bash
k6 run stress-test-ejz.js
```
⏱️ Runs ~48 minutes with 2000 peak concurrent users

---

### 2️⃣ **K6 Cloud — Single Zone (Free Tier)**
```bash
export K6_CLOUD_TOKEN=your-token-here
k6 cloud StressTestCloud.js
```
⏱️ Runs ~30 minutes from US East (Ashburn) by default

---

### 3️⃣ **Test Different Geographic Zone**

Edit `StressTestCloud.js` line 128-150, uncomment desired zone:

```javascript
// Uncomment one of these:
"amazon:ie:dublin": { loadZone: "amazon:ie:dublin", percent: 100 },
// OR
"amazon:sg:singapore": { loadZone: "amazon:sg:singapore", percent: 100 },
// OR
"amazon:jp:tokyo": { loadZone: "amazon:jp:tokyo", percent: 100 },
```

Then run:
```bash
k6 cloud StressTestCloud.js
```

---

### 4️⃣ **Quick Spike Test** (5 minutes)
```bash
k6 run --stage '3m:2000' --stage '2m:0' stress-test-ejz.js
```
Jump directly to spike, no ramp-up

---

### 5️⃣ **Export Full Results** (JSON + HTML)
```bash
k6 run --out json=results.json stress-test-ejz.js
```
Generates:
- `results.json` — Machine readable
- `ejz-stress-report-[timestamp].html` — Beautiful HTML report
- `ejz-stress-summary-[timestamp].json` — Test summary

---

### 6️⃣ **Live Web Dashboard** (Real-time)
```bash
k6 run --out web-dashboard stress-test-ejz.js
```
Opens http://localhost:5665 with live graphs

---

### 7️⃣ **Custom Configuration**
```bash
k6 run \
  -e TARGET_URL=https://ejz-frontend.vercel.app \
  -e MAX_VUS=3000 \
  -e TEST_EMAIL=admin@test.com \
  -e TEST_PASS=AdminPass123! \
  stress-test-ejz.js
```

---

### 8️⃣ **Docker + Grafana Stack** (Advanced)
```bash
# Terminal 1: Start infrastructure
docker compose up -d grafana influxdb

# Terminal 2: Run test (will stream metrics to InfluxDB)
docker compose run k6

# Open browser
# → Grafana: http://localhost:3000 (admin/admin)
# → InfluxDB: http://localhost:8086
```

---

## 📊 What Gets Tested

| Endpoint | VUs | Test Type |
|----------|-----|-----------|
| `/register` | 40% | Registration form + submit |
| `/login` | 30% | Authentication + error paths |
| `/billing?newUser=true` | 15% | New user upsell |
| `/dashboard/billing` | 15% | Existing user billing mgmt |

---

## ✅ Success Indicators (Look for these in output)

```
✓ http_req_failed ........................... 0.00-0.95%
✓ http_req_duration....................... p(95)<5s
✓ login_success_rate ....................... 99%+
✓ register_success_rate .................... 99%+
✓ billing_page_views ....................... 100k+
```

**If you see `✓` next to thresholds = Server is healthy!**

---

## 🌍 Available Global Zones (for K6 Cloud)

| Region | Location | Zone Code |
|--------|----------|-----------|
| **US** | N. Virginia | `amazon:us:ashburn` |
| **US** | Ohio | `amazon:us:columbus` |
| **US** | Palo Alto | `amazon:us:palo alto` |
| **US** | Portland | `amazon:us:portland` |
| **Canada** | Montreal | `amazon:ca:montreal` |
| **Brazil** | São Paulo | `amazon:br:sao paulo` |
| **Ireland** | Dublin | `amazon:ie:dublin` |
| **UK** | London | `amazon:gb:london` |
| **Germany** | Frankfurt | `amazon:de:frankfurt` |
| **France** | Paris | `amazon:fr:paris` |
| **Sweden** | Stockholm | `amazon:se:stockholm` |
| **Italy** | Milan | `amazon:it:milan` |
| **South Africa** | Cape Town | `amazon:sa:cape town` |
| **India** | Mumbai | `amazon:in:mumbai` |
| **Hong Kong** | Hong Kong | `amazon:cn:hong kong` |
| **Singapore** | Singapore | `amazon:sg:singapore` |
| **Korea** | Seoul | `amazon:kr:seoul` |
| **Japan** | Tokyo | `amazon:jp:tokyo` |
| **Japan** | Osaka | `amazon:jp:osaka` |
| **Australia** | Sydney | `amazon:au:sydney` |

---

## 📝 Subscription Plans

| Feature | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Load Zones | 1 | Unlimited |
| Test Duration | 30 min max | Unlimited |
| Virtual Users | 100 | 10,000+ |
| Data Retention | 7 days | 1+ years |
| Cost | $0/month | $99+/month |

> Upgrade at: https://app.k6.io/account/billing

---

## 🆘 Troubleshooting

**Error: "No active Subscription supports... (6 > max of 1)"**
→ You're on Free tier. Only test 1 zone at a time. Uncomment only ONE zone in distribution section.

**Error: "Connection refused"**
→ Target server is down or unreachable. Check `TARGET_URL` environment variable.

**Thresholds failing?**
→ Server may be overloaded. Reduce `MAX_VUS` or increase threshold limits in code.

---

## ⚠️ Common Issues & Fixes

### Error: "k6: command not found"
```bash
# Install k6 first:
brew install k6          # macOS
sudo snap install k6     # Linux
winget install k6        # Windows (Admin)
choco install k6         # Windows (Chocolatey)
```

### Error: "Cannot connect to target"
- Verify `TARGET_URL` is correct
- Check if site is accessible: `curl https://ejz-frontend.vercel.app`
- Try adding timeout: `k6 run --http-debug stress-test-ejz.js`

### High Error Rate During Test
- Check server logs for 5xx errors
- Verify database connections aren't exhausted
- Check if CDN/WAF is blocking legitimate traffic

### Out of Memory
- Reduce MAX_VUS: `-e MAX_VUS=1000`
- Run on machine with more RAM
- Use k6 Cloud for distributed load (no local memory pressure)

---

## 📈 Understanding Results

### Response Time Metrics
- **p50** (50th percentile) = Normal speed
- **p95** (95th percentile) = 95% of requests faster than this
- **p99** (99th percentile) = Slowest 1% of requests

Example: If `p95 < 3000`, then 95% of requests respond within 3 seconds ✅

### Success Rate
- **Login success rate > 85%** = OK under stress
- **Register success rate > 80%** = OK under stress
- **< 80% under max load** = Server struggling, needs scaling

### Error Rate
- **< 1%** = Excellent
- **1-5%** = Acceptable
- **> 5%** = Critical, investigate

---

## 🎯 Load Phases (What Happens When)

```
Time  0-3m:   Warm-up (0→200 VUs)
      3-7m:   Ramp (200→500 VUs)
      7-12m:  Normal (500 steady)
     12-16m:  Stress (500→1000 VUs)
     16-21m:  Heavy (1000 steady)
     21-23m:  SPIKE (1000→2000 VUs) ⚡
     23-28m:  Hold (2000 steady) ⚡
     28-30m:  Drop (2000→1000 VUs)
     30-45m:  Soak (1000 steady - memory leak check)
     45-48m:  Cool down (1000→0 VUs)
```

---

## 📝 Sample Output Interpretation

```
✓ registrations....................... 2840 success, 285 fails
✓ logins .............................. 1920 success, 210 fails
✓ billing page views .................. 1560
✓ avg response time ................... 456 ms
✓ p95 response time ................... 2.3s ✅
✓ error rate .......................... 1.2% ✅
```

**Result: ✅ PASS** — Server handled the load well!

---

## 🔗 Links & Resources

- [k6 Docs](https://k6.io/docs)
- [HTTP Request Details](https://k6.io/docs/using-k6/http-requests/)
- [Thresholds/SLOs](https://k6.io/docs/using-k6/thresholds/)
- [Report Issues](https://github.com/grafana/k6/issues)

---

## 💡 Pro Tips

1. **Run tests during low-traffic hours** to get cleaner baseline
2. **Compare results over time** to spot performance regressions
3. **Test after deployments** to catch issues early
4. **Archive reports** for compliance/auditing
5. **Use k6 Cloud** for production testing without impacting local machine

---

**Happy stress testing! 🎉**
