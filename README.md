# EJZ Frontend — Comprehensive K6 Stress Test Suite

**Target**: `https://ejz-frontend.vercel.app`  
**Endpoints Tested**:
- `/register` — User registration
- `/login` — User authentication  
- `/billing?newUser=true` — New user billing flow
- `/dashboard/billing` — Existing user billing management

**Tool**: [Grafana k6](https://k6.io) Cloud Edition  
**Max Concurrent Users**: 100 VUs (Cloud Free Tier)  
**Test Duration**: ~30 minutes  
**Global Zones**: 20 load zones available

---

## 🌍 Supported Global Load Zones

The test can run from any of these 20 geographic locations:

### North America (4 zones)
- `amazon:us:ashburn` — US East (N. Virginia)
- `amazon:us:columbus` — US Central (Ohio)  
- `amazon:us:palo alto` — US West (Palo Alto)
- `amazon:us:portland` — US West (Oregon)
- `amazon:ca:montreal` — Canada (Montreal)

### South America (1 zone)
- `amazon:br:sao paulo` — Brazil (São Paulo)

### Europe (6 zones)
- `amazon:ie:dublin` — Ireland (Dublin)
- `amazon:gb:london` — UK (London)
- `amazon:de:frankfurt` — Germany (Frankfurt)
- `amazon:fr:paris` — France (Paris)
- `amazon:se:stockholm` — Sweden (Stockholm)
- `amazon:it:milan` — Italy (Milan)

### Africa (1 zone)
- `amazon:sa:cape town` — South Africa (Cape Town)

### Asia Pacific (8 zones)
- `amazon:in:mumbai` — India (Mumbai)
- `amazon:cn:hong kong` — Hong Kong
- `amazon:sg:singapore` — Singapore
- `amazon:kr:seoul` — South Korea (Seoul)
- `amazon:jp:tokyo` — Japan (Tokyo)
- `amazon:jp:osaka` — Japan (Osaka)
- `amazon:au:sydney` — Australia (Sydney)

---

## ⏱️ Load Profile (100 peak VUs)

| Phase          | Duration | VUs            | Purpose                  |
|----------------|----------|----------------|--------------------------|
| Warm-up        | 2 min    | 0 → 20         | Baseline establishment   |
| Ramp-up        | 2 min    | 20 → 30        | Gradual increase         |
| Normal load    | 3 min    | 30 (steady)    | Typical traffic          |
| Stress ramp    | 2 min    | 30 → 50        | Beyond normal capacity   |
| Heavy load     | 3 min    | 50 (steady)    | Sustained stress         |
| **Spike**      | 2 min    | 50 → **100**   | Sudden traffic burst     |
| Spike hold     | 3 min    | 100 (steady)   | Spike endurance          |
| Spike drop     | 1 min    | 100 → 50       | Recovery check           |
| Soak           | 10 min   | 50 (steady)    | Memory/leak detection    |
| Ramp-down      | 2 min    | 50 → 0         | Graceful wind-down       |

**Total duration: ~30 minutes | Peak VUs: 100**

---

## 👥 User Journey Simulation (VU Distribution)

The test simulates realistic user behavior with three concurrent journeys:

### 1️⃣ **New User Registration Flow (40% of VUs)**
- Load `/register` page
- Submit registration with unique credentials
- Load post-registration assets
- Metrics: Registration success rate, page load time

### 2️⃣ **Existing User Login Flow (30% of VUs)**
- Load `/login` page
- Submit login with mixed credentials (70% valid, 30% error paths)
- Load post-login assets
- Metrics: Login success rate, authentication response time

### 3️⃣ **Billing & Upsell Flow (30% of VUs)**
- Load `/billing?newUser=true` (50%) OR `/dashboard/billing` (50%)
- Simulate billing page interactions
- Load billing assets
- Metrics: Page load time, billing action response time

---

## 📊 Key Metrics Tracked

| Metric                  | Threshold | Description                    |
|-------------------------|-----------|--------------------------------|
| `login_response_ms`     | p95 < 4s  | Login response time            |
| `register_response_ms`  | p95 < 5s  | Registration response time     |
| `billing_response_ms`   | p95 < 4s  | Billing action response time   |
| `page_load_time_ms`     | p95 < 6s  | Page load time (all pages)     |
| `http_req_failed`       | < 1%      | HTTP failure rate              |
| `http_req_duration`     | p99 < 7s  | Overall HTTP request duration  |
| `active_users` (gauge)  | Track     | Current concurrent users       |
| `error_count` (counter) | Track     | Total errors during test       |
| `billing_page_views`    | Track     | Billing page view count        |

---

## ⚡ Quick Start

### Local Stress Test
```bash
k6 run stress-test-ejz.js
```

### K6 Cloud — Single Zone (Free Tier)
```bash
export K6_CLOUD_TOKEN=your-token-here
k6 cloud StressTestCloud.js
```

Uncomment desired zone in `StressTestCloud.js` distribution section (line 128-150)

### K6 Cloud — Custom Zone Configuration
Edit `StressTestCloud.js` and uncomment the zone you want:

```javascript
distribution: {
  "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 100 },
  // Uncomment other zones or modify percentages
}
```

### Export Results
```bash
k6 run --out json=results.json stress-test-ejz.js
```

Generates:
- `results.json` — Machine readable data
- `ejz-stress-report-[timestamp].html` — Beautiful HTML report
- `ejz-stress-summary-[timestamp].json` — Test summary

### Live Web Dashboard
```bash
k6 run --out web-dashboard stress-test-ejz.js
```
Opens http://localhost:5665 with real-time metrics

### Docker + Grafana Stack
```bash
# Start infrastructure
docker compose up -d grafana influxdb

# Run test
docker compose run k6

# Access Grafana at http://localhost:3000 (admin/admin)
```

---

## 🔐 Licensing & Subscription Notes

- **Free Tier**: 1 load zone per test, ~30 minute tests
- **Paid Tier**: Multiple zones with load distribution
- **Upgrade**: Go to [app.k6.io](https://app.k6.io) to upgrade subscription

---

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Cloud Guide](https://k6.io/docs/cloud/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/)

```bash
k6 run --stage '5m:2000' --stage '2m:0' stress-test-ejz.js
```

### Run with Custom VU Limits
```bash
k6 run -e MAX_VUS=500 stress-test-ejz.js      # 500 VU spike instead of 2000
k6 run -e MAX_VUS=5000 stress-test-ejz.js     # More aggressive: 5000 VUs
```

### Monitor in Real-time (InfluxDB Backend)
```bash
k6 run --out influxdb=http://localhost:8086/k6 stress-test-ejz.js
```

---

## 📈 Expected Results (Baseline)

Under healthy conditions with 2000 peak VUs:

| Metric | Expected Value |
|--------|-----------------|
| Success Rate (Login)     | > 95% |
| Success Rate (Register)  | > 90% |
| p95 Response Time        | < 2.5s |
| Error Rate               | < 1% |
| Average Response Time    | 300–600 ms |

---

## 🚨 Interpreting Results

### ✅ **Green Flags**
- All thresholds passed (console shows `✓`)
- Response times consistent across regions
- No memory leaks (steady line on soak phase)
- Success rates above 95%

### ⚠️ **Yellow Flags** (Needs Optimization)
- Response time p95 between 3-5 seconds
- Success rate between 80-95%
- Gradual increase in errors during soak phase

### 🔴 **Red Flags** (Critical Issues)
- Response times > 5s consistently
- Success rate < 80%
- HTTP error rate > 5%
- Crash/shutdown during spike phase
- Timeouts or 503 errors during peak load

---

## 🛠️ Troubleshooting

### High Error Rate During Spike
- Check server capacity/scaling policies
- Review error logs on server side
- Verify CDN/load balancer configuration
- Check database connection pool limits

### Uneven Response Times Across Regions
- Verify server deployed globally or behind CDN
- Check regional routing configuration
- Review latency simulation settings

### Memory Issues During Soak
- Check for memory leaks in application
- Monitor garbage collection
- Review database query efficiency

---

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs)
- [k6 Best Practices](https://k6.io/docs/testing-guides/k6-best-practices/)
- [InfluxDB Integration](https://k6.io/docs/results-visualization/influxdb/)
- [Threshold Reference](https://k6.io/docs/using-k6/thresholds/)

---

## 🔄 Continuous Monitoring

Add this test to your CI/CD pipeline:

```yaml
# Example: GitHub Actions
- name: Run K6 Stress Test
  run: |
    k6 run \
      --out json=stress-results.json \
      -e TARGET_URL=${{ env.APP_URL }} \
      stress-test-ejz.js
  env:
    APP_URL: https://ejz-frontend.vercel.app

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: stress-test-results
    path: stress-results.json
```
winget install k6        # Windows

# Run the test
k6 run stress-test-ejz.js

# Run with live web dashboard
k6 run --out web-dashboard stress-test-ejz.js
# Open http://localhost:5665

# Override credentials / URL
TARGET_URL=https://ejz-frontend.vercel.app \
TEST_EMAIL=you@email.com \
TEST_PASS=yourpassword \
k6 run stress-test-ejz.js
```

### Option 2 — Docker + Grafana Dashboard (recommended)

```bash
# Start InfluxDB + Grafana first
docker compose up -d grafana influxdb

# Open Grafana: http://localhost:3000  (user: admin / pass: admin)
# Import k6 dashboard ID: 2587 from grafana.com

# Run the test (streams metrics to InfluxDB in real time)
docker compose run k6
```

### Option 3 — k6 Cloud (real geo-distributed)

```bash
export K6_CLOUD_TOKEN=your_token_here

# Uncomment the ext.loadimpact block in stress-test-ejz.js, then:
k6 cloud stress-test-ejz.js
```

---

## SLO Thresholds

| Metric                        | Threshold     |
|-------------------------------|---------------|
| Login response p95            | < 3,000 ms    |
| Page load p95                 | < 5,000 ms    |
| HTTP failure rate             | < 5%          |
| Login success rate            | > 90%         |
| Overall p99 HTTP duration     | < 6,000 ms    |

If any threshold is breached, k6 exits with code `99` (CI-friendly).

---

## Output Files

After the run, two files are generated in the working directory:

- `ejz-stress-report-<timestamp>.html` — visual HTML report (open in browser)
- `ejz-stress-summary-<timestamp>.json` — raw metrics JSON

---

## Credential Mix

The test intentionally sends a realistic mix:

| Scenario            | Share | Purpose                        |
|---------------------|-------|--------------------------------|
| Valid credentials   | 70%   | Happy-path login flow          |
| Wrong password      | 20%   | Error-path / 401 performance   |
| Non-existent user   | 10%   | Edge-case / DB miss latency    |

---

## Notes

- **Rate limiting**: Vercel and your API may rate-limit after ~200 req/s. Monitor `http_req_failed` in real time.
- **CORS / CSP**: The test sends `Origin` and `Referer` headers matching the site's own origin.
- **Auth token**: If login returns a JWT/session cookie, extend the script to reuse it for authenticated endpoints.
