# 🔧 Advanced Configuration Guide

## Environment Variables (Customization)

### Core Configuration
```bash
# Set target URL
-e TARGET_URL=https://your-site.com

# Set peak virtual users (default: 100 for Cloud, 2000 for local)
-e MAX_VUS=500

# Set test credentials
-e TEST_EMAIL=testuser@example.com
-e TEST_PASS=YourPassword123!
```

### Example: Different Target & Lower VU Limit
```bash
k6 run \
  -e TARGET_URL=https://staging.ejz.io \
  -e MAX_VUS=500 \
  stress-test-ejz.js
```

---

## K6 Cloud Zones Configuration

### Free Tier (1 Zone Maximum)

Edit `StressTestCloud.js` around line 128-150. **Uncomment ONLY ONE zone**:

```javascript
distribution: {
  // US Zones - Pick ONE
  "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 100 },
  // "amazon:us:columbus": { loadZone: "amazon:us:columbus", percent: 100 },
  // ... other zones remain commented
}
```

### Paid Tier (Multiple Zones)

Uncomment multiple zones. Percentages must total 100%:

```javascript
distribution: {
  // 50/50 split US and Europe
  "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 50 },
  "amazon:ie:dublin":  { loadZone: "amazon:ie:dublin",  percent: 50 },
}
```

Or distribute across all 20 zones (5% each):

```javascript
distribution: {
  "amazon:us:ashburn":    { loadZone: "amazon:us:ashburn",    percent: 5 },
  "amazon:us:columbus":   { loadZone: "amazon:us:columbus",   percent: 5 },
  "amazon:us:palo alto":  { loadZone: "amazon:us:palo alto",  percent: 5 },
  "amazon:us:portland":   { loadZone: "amazon:us:portland",   percent: 5 },
  "amazon:ca:montreal":   { loadZone: "amazon:ca:montreal",   percent: 5 },
  "amazon:br:sao paulo":  { loadZone: "amazon:br:sao paulo",  percent: 5 },
  "amazon:ie:dublin":     { loadZone: "amazon:ie:dublin",     percent: 5 },
  "amazon:gb:london":     { loadZone: "amazon:gb:london",     percent: 5 },
  "amazon:de:frankfurt":  { loadZone: "amazon:de:frankfurt",  percent: 5 },
  "amazon:fr:paris":      { loadZone: "amazon:fr:paris",      percent: 5 },
  "amazon:se:stockholm":  { loadZone: "amazon:se:stockholm",  percent: 5 },
  "amazon:it:milan":      { loadZone: "amazon:it:milan",      percent: 5 },
  "amazon:sa:cape town":  { loadZone: "amazon:sa:cape town",  percent: 5 },
  "amazon:in:mumbai":     { loadZone: "amazon:in:mumbai",     percent: 5 },
  "amazon:cn:hong kong":  { loadZone: "amazon:cn:hong kong",  percent: 5 },
  "amazon:sg:singapore":  { loadZone: "amazon:sg:singapore",  percent: 5 },
  "amazon:kr:seoul":      { loadZone: "amazon:kr:seoul",      percent: 5 },
  "amazon:jp:tokyo":      { loadZone: "amazon:jp:tokyo",      percent: 5 },
  "amazon:jp:osaka":      { loadZone: "amazon:jp:osaka",      percent: 5 },
  "amazon:au:sydney":     { loadZone: "amazon:au:sydney",     percent: 5 },
}
```

---

## Modifying Test Stages

Edit `StressTestCloud.js` or `stress-test-ejz.js` in the `stages` array:

### Current Cloud Profile (30 minutes)
```javascript
export const options = {
  stages: [
    { duration: "2m",  target: 20  },   // Warm-up
    { duration: "2m",  target: 30  },   // Ramp
    { duration: "3m",  target: 30  },   // Normal
    { duration: "2m",  target: 50  },   // Stress ramp
    { duration: "3m",  target: 50  },   // Heavy
    { duration: "2m",  target: 100 },   // Spike
    { duration: "3m",  target: 100 },   // Spike hold
    { duration: "1m",  target: 50  },   // Drop
    { duration: "10m", target: 50  },   // Soak
    { duration: "2m",  target: 0   },   // Ramp-down
  ],
};
```

### Quick 10-minute spike test
```javascript
stages: [
  { duration: "2m",  target: 500  },
  { duration: "3m",  target: 1500 },
  { duration: "5m",  target: 0    },
]
```

### Extended soak test (memory leaks detection)
```javascript
stages: [
  { duration: "5m",  target: 500  },
  { duration: "30m", target: 500  },  // 30min at steady load
  { duration: "2m",  target: 0    },
]
```

### Gradual ramp only (no spike)
```javascript
stages: [
  { duration: "15m", target: 2000 },  // Slowly reach peak
  { duration: "5m",  target: 0    },
]
```

---

## Modifying User Journey Distribution

Edit the `export default function()` in the test file to change VU split:

### Current Distribution (40/30/30)
```javascript
if (userJourney <= 40) {
  testRegistrationFlow(headers, regionName);    // 40% registration
} else if (userJourney <= 70) {
  testLoginFlow(headers, regionName);           // 30% login
} else {
  testBillingFlow(headers, regionName);         // 30% billing
}
```

### Example: More focus on login (60/20/20)
```javascript
if (userJourney <= 60) {           // ← Changed from 40
  testLoginFlow(headers, regionName);           // 60% login
} else if (userJourney <= 80) {    // ← Changed from 70
  testRegistrationFlow(headers, regionName);    // 20% registration
} else {
  testBillingFlow(headers, regionName);         // 20% billing
}
```

### Example: Heavy billing focus (30/20/50)
```javascript
if (userJourney <= 30) {
  testRegistrationFlow(headers, regionName);    // 30%
} else if (userJourney <= 50) {
  testLoginFlow(headers, regionName);           // 20%
} else {
  testBillingFlow(headers, regionName);         // 50% - HEAVY
}
```

---

## Modifying Thresholds (SLOs)

Edit the `thresholds` object in options:

```javascript
thresholds: {
  "login_response_ms":     ["p(95)<4000"],    // 95th percentile under 4s
  "register_response_ms":  ["p(95)<5000"],    // 95th percentile under 5s
  "billing_response_ms":   ["p(95)<4000"],
  "page_load_time_ms":     ["p(95)<6000"],
  "http_req_duration":     ["p(99)<7000"],    // 99th percentile under 7s
},
```

### Stricter SLOs (for critical services)
```javascript
thresholds: {
  "http_req_failed": ["rate<0.1"],             // Less than 0.1% failure rate
  "http_req_duration": ["p(95)<1000"],         // 95th percentile under 1 second
  "login_response_ms": ["p(95)<2000"],         // Login must be fast
},
```

---

## Docker Compose Configuration

Edit `docker-compose.yml` to customize:

```yaml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    
  influxdb:
    image: influxdb:2.0
    ports:
      - "8086:8086"
    environment:
      - INFLUXDB_DB=k6

  k6:
    image: grafana/k6:latest
    ports:
      - "6565:6565"
    environment:
      - K6_VUS=100
      - K6_DURATION=30m
      - K6_OUT=influxdb=http://influxdb:8086/k6
```

---

## Common Custom Scenarios

### API Load Testing (No UI/Assets)
```javascript
// Remove http.batch calls for static assets
// Keep only main endpoint requests
```

### Mobile Network Simulation
```javascript
thresholds: {
  "http_req_duration": ["p(95)<5000"],  // Relaxed for slower connections
},
```

### Database-Heavy Workload
```javascript
// Increase soak duration to detect memory leaks
{ duration: "30m", target: 50 },  // Long steady load
```

---

## Custom Test Journeys

Create a new journey function:

```javascript
function testCheckoutFlow(headers, regionName) {
  group("1_checkout_page_load", () => {
    const res = http.get(`${BASE_URL}/checkout`, { headers });
    pageLoadTime.add(Date.now() - start, { region: regionName, endpoint: "checkout" });
  });
  
  sleep(randomIntBetween(2, 4));
  
  group("2_checkout_submit", () => {
    const payload = JSON.stringify({
      cartId: "cart_" + randomIntBetween(1000, 9999),
      paymentMethod: "card",
    });
    const res = http.post(`${BASE_URL}/api/checkout`, payload, { headers });
    // add metrics, checks, etc.
  });
}
```

Then add to main function:
```javascript
if (userJourney <= 50) {
  testCheckoutFlow(headers, regionName);    // 50%
} else if (userJourney <= 80) {
  testLoginFlow(headers, regionName);       // 30%
} else {
  testBillingFlow(headers, regionName);     // 20%
}
```

---

## Adding Custom Metrics

### Track specific events
```javascript
// At top with other metrics:
const checkoutCompletions = new Counter("checkout_completions");
const cartAbandonments = new Counter("cart_abandonments");
const paymentFailures = new Counter("payment_failures");

// In your test:
checkoutCompletions.add(1, { region: regionName });
cartAbandonments.add(1, { reason: "timeout" });
paymentFailures.add(1, { errorCode: res.status });
```

### Track response time per endpoint
```javascript
const checkoutTime = new Trend("checkout_response_ms", true);

// In test:
const start = Date.now();
const res = http.post(`${BASE_URL}/api/checkout`, payload, { headers });
const elapsed = Date.now() - start;
checkoutTime.add(elapsed, { region: regionName });
```

---

## Modifying Thresholds (SLOs)

Edit the `thresholds` object:

```javascript
thresholds: {
  "login_response_ms": ["p(95)<2000"],      // Stricter: < 2s instead of 3s
  "http_req_failed": ["rate<0.01"],         // Stricter: < 1% instead of 5%
  "http_req_duration": ["p(99)<5000"],      // Relaxed: < 5s instead of 6s
  "custom_metric": ["rate>0.95"],           // Custom metric threshold
}
```

**Note:** Test FAILS if any threshold is not met (shown in console as ✗)

---

## Adding Regional Variations

Add custom regions:

```javascript
const REGIONS = [
  { name: "us-west-2",   label: "US West (Oregon)",     latency: [30,  100]  },
  { name: "us-east-1",   label: "US East (N. Virginia)", latency: [20,  80]   },
  // ... more regions
  { name: "au-east-1",   label: "Australia (Sydney)",   latency: [200, 350]  },
];
```

Add corresponding language:
```javascript
function pickLanguage(region) {
  const map = {
    "au-east-1": "en-AU,en;q=0.9",  // ← Add this
    // ... rest
  };
  return map[region] || "en-US,en;q=0.9";
}
```

---

## Advanced: HTTP Keep-Alive vs New Connections

Current (Keep-alive ON — more realistic):
```javascript
export const options = {
  noConnectionReuse: false,    // Keep connections alive
```

To test with new connection per request:
```javascript
export const options = {
  noConnectionReuse: true,    // New connection each time (stressful!)
```

---

## Advanced: Cookie & Session Handling

Add session tracking:

```javascript
import { CookieJar } from "https://jslib.k6.io/http/1.1.0/index.js";

const jar = new CookieJar();

export default function() {
  const res = http.get(LOGIN_URL, {
    headers: headers,
    cookies: jar.cookiesForURL(LOGIN_URL),
  });
  
  jar.cookiesForURL(LOGIN_URL);  // Store cookies from response
}
```

---

## Debugging: HTTP Request Details

Show full request/response:

```bash
# Log all HTTP traffic
k6 run --http-debug stress-test-ejz.js

# Log only request headers
k6 run --http-debug=full stress-test-ejz.js

# Log with verbose output
k6 run -v stress-test-ejz.js
```

---

## Performance Optimization Tips

### For Local Tests (reduce resource usage)
```bash
# Limit VUs to available cores:
-e MAX_VUS=16

# Reduce batch size in tests
# Edit http.batch() calls to smaller arrays
```

### For Cloud Tests
```bash
# Use k6 Cloud for higher VU counts without local resource issues
k6 cloud stress-test-ejz.js

# Distribute across regions automatically via cloud
```

---

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Stress Test

on: 
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  stress-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: sudo apt-get install -y gnupg2 curl
             && curl https://dl.k6.io/apt/linux.gpg | sudo apt-key add -
             && echo "deb https://dl.k6.io/apt debian main" | sudo tee /etc/apt/sources.list.d/k6-stable.list
             && sudo apt-get update && sudo apt-get install -y k6
      
      - name: Run stress test
        run: k6 run --out json=results.json stress-test-ejz.js
        env:
          TARGET_URL: ${{ secrets.STAGING_URL }}
          MAX_VUS: 500
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: stress-test-results
          path: results.json
```

---

## Monitoring & Alerts Integration

### Send to DataDog
```bash
k6 run --out statsd stress-test-ejz.js
```

### Send to New Relic
Add to `options`:
```javascript
ext: {
  loadimpact: {
    // ... other config
    name: "ejz-stress-test",
  },
},
```

### Send to CloudWatch (AWS)
```bash
k6 run --out cloudwatch stress-test-ejz.js
```

---

## Troubleshooting Custom Changes

**Error: "Unexpected token"**
- Check JavaScript syntax (matching braces, semicolons)
- Test with: `k6 run -v stress-test-ejz.js`

**Metric not appearing**
- Ensure metric is defined at top: `const myMetric = new Counter("name")`
- Ensure it's populated: `myMetric.add(value)`
- Check console output: `k6 run stress-test-ejz.js | grep myMetric`

**Threshold not working**
- Metric must be populated (not zero)
- Use exact metric name in thresholds
- Test: `k6 run stress-test-ejz.js --no-summary`

---

## Sample Complete Custom Test

```javascript
// Testing a shopping flow
export default function() {
  const { headers, jitter, regionName } = getRegionHeaders();
  sleep(jitter / 1000);
  
  // 1. Browse products
  const res1 = http.get(`${BASE_URL}/products`, { headers });
  check(res1, { "products page: 200": r => r.status === 200 });
  sleep(randomIntBetween(2, 5));
  
  // 2. Add to cart
  const res2 = http.post(`${BASE_URL}/api/cart/add`, 
    JSON.stringify({ productId: "prod_123", qty: 1 }), 
    { headers }
  );
  check(res2, { "add to cart: 200": r => r.status === 200 });
  sleep(randomIntBetween(1, 3));
  
  // 3. Checkout
  const res3 = http.post(`${BASE_URL}/api/checkout`,
    JSON.stringify({ cartId: res2.json().cartId }),
    { headers }
  );
  check(res3, { "checkout: 200": r => r.status === 200 });
}
```

---

**Need more help? Check k6 docs: https://k6.io/docs**
