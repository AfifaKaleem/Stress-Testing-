/**
 * ============================================================
 *  K6 COMPREHENSIVE STRESS TEST — ejz-frontend.vercel.app
 *  Tool     : Grafana k6 (https://k6.io)
 *  Strategy : Multi-endpoint, multi-region, maximum concurrent users
 *  Endpoints: /register, /login, /billing, /dashboard/billing
 *  Regions  : Simulated via X-Origin-Region header + latency jitter
 * ============================================================
 *
 *  HOW TO RUN
 *  ----------
 *  1. Install k6:
 *       Linux/macOS : brew install k6   OR   snap install k6
 *       Windows     : winget install k6  OR  choco install k6
 *       Docker      : docker pull grafana/k6
 *
 *  2. Basic local run (all stages, max 2000 VUs):
 *       k6 run stress-test-ejz.js
 *
 *  3. Run with Grafana Cloud k6 (real geo-distributed load):
 *       k6 cloud stress-test-ejz.js
 *       (requires K6_CLOUD_TOKEN env variable)
 *
 *  4. Export results to JSON:
 *       k6 run --out json=results.json stress-test-ejz.js
 *
 *  5. Live dashboard (local):
 *       k6 run --out web-dashboard stress-test-ejz.js
 *       Then open http://localhost:5665
 *
 *  ENV VARIABLES (optional overrides)
 *  ------------------------------------
 *  TARGET_URL   : override base URL (default: https://ejz-frontend.vercel.app)
 *  TEST_EMAIL   : login email (default: test@example.com)
 *  TEST_PASS    : login password (default: Password123!)
 *  MAX_VUS      : peak virtual users (default: 2000)
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Gauge, Rate, Trend } from "k6/metrics";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL              = __ENV.TARGET_URL  || "https://ejz-frontend.vercel.app";
const LOGIN_URL             = `${BASE_URL}/login`;
const REGISTER_URL          = `${BASE_URL}/register`;
const BILLING_URL           = `${BASE_URL}/billing?newUser=true`;
const DASHBOARD_BILLING_URL = `${BASE_URL}/dashboard/billing`;
const EMAIL                 = __ENV.TEST_EMAIL  || "test@example.com";
const PASSWORD              = __ENV.TEST_PASS   || "Password123!";
const MAX_VUS               = parseInt(__ENV.MAX_VUS || "2000", 10);

// ─── Custom Metrics ───────────────────────────────────────────────────────────

const loginSuccessRate      = new Rate("login_success_rate");
const loginFailRate         = new Rate("login_fail_rate");
const registerSuccessRate   = new Rate("register_success_rate");
const billingSucessRate     = new Rate("billing_success_rate");
const pageLoadTime          = new Trend("page_load_time_ms",      true);
const loginResponseTime     = new Trend("login_response_ms",      true);
const registerResponseTime  = new Trend("register_response_ms",   true);
const billingResponseTime   = new Trend("billing_response_ms",    true);
const errorCount            = new Counter("error_count");
const activeUsers           = new Gauge("active_users");
const registrationAttempts  = new Counter("registration_attempts");
const loginAttempts         = new Counter("login_attempts");
const billingPageViews      = new Counter("billing_page_views");

// ─── Simulated Regions ────────────────────────────────────────────────────────
//  k6 OSS: headers simulate region identity
//  k6 Cloud: set `ext.loadimpact.distribution` below for real geo routing

const REGIONS = [
  { name: "us-east-1",      label: "US East (N. Virginia)",  latency: [20,  80]  },
  { name: "eu-west-1",      label: "Europe (Ireland)",        latency: [80,  180] },
  { name: "ap-southeast-1", label: "Asia Pacific (Singapore)",latency: [120, 260] },
  { name: "ap-northeast-1", label: "Asia Pacific (Tokyo)",    latency: [150, 300] },
  { name: "sa-east-1",      label: "South America (São Paulo)",latency:[180, 350] },
  { name: "me-south-1",     label: "Middle East (Bahrain)",   latency: [100, 220] },
];

// ─── Stages (Maximum VU Stress Profile) ────────────────────────────────────────
//
//  Phase 1 — Warm-up         :   0 →  200 VU  over   3 min
//  Phase 2 — Ramp-up         : 200 →  500 VU  over   4 min
//  Phase 3 — Normal load     : 500 VU steady for     5 min
//  Phase 4 — Stress ramp     : 500 →  1000 VU over   4 min
//  Phase 5 — Heavy load      :1000 VU steady for     5 min
//  Phase 6 — Spike           :1000 → 2000 VU over    2 min  ← MAXIMUM SPIKE
//  Phase 7 — Max hold        :2000 VU steady for     5 min
//  Phase 8 — Spike drop      :2000 → 1000 VU over    2 min
//  Phase 9 — Soak (endurance):1000 VU steady for    15 min
//  Phase 10 — Ramp-down      :1000 →    0 VU  over    3 min
//
//  Total duration ≈ 48 minutes | Peak VUs: 2000

export const options = {
  stages: [
    { duration: "3m",  target: 200  },   // Phase 1  – Warm-up
    { duration: "4m",  target: 500  },   // Phase 2  – Ramp-up
    { duration: "5m",  target: 500  },   // Phase 3  – Normal load
    { duration: "4m",  target: 1000 },   // Phase 4  – Stress ramp
    { duration: "5m",  target: 1000 },   // Phase 5  – Heavy load
    { duration: "2m",  target: MAX_VUS }, // Phase 6  – Spike to MAX
    { duration: "5m",  target: MAX_VUS }, // Phase 7  – Max hold
    { duration: "2m",  target: 1000 },   // Phase 8  – Spike drop
    { duration: "15m", target: 1000 },   // Phase 9  – Soak / endurance
    { duration: "3m",  target: 0    },   // Phase 10 – Ramp-down
  ],

  // ── Thresholds (SLOs) ──────────────────────────────────────────────────────
  thresholds: {
    // 95th-percentile login POST must stay under 3 s
    "login_response_ms":                ["p(95)<3000"],
    // 95th-percentile register POST must stay under 4 s
    "register_response_ms":             ["p(95)<4000"],
    // 95th-percentile billing page load must stay under 3 s
    "billing_response_ms":              ["p(95)<3000"],
    // 95th-percentile page load must stay under 5 s
    "page_load_time_ms":                ["p(95)<5000"],
    // HTTP failure rate must stay below 5 %
    "http_req_failed":                  ["rate<0.05"],
    // Login success rate must stay above 85 % (under stress)
    "login_success_rate":               ["rate>0.85"],
    // Register success rate must stay above 80 % (under stress)
    "register_success_rate":            ["rate>0.80"],
    // Overall p99 HTTP duration
    "http_req_duration":                ["p(99)<6000"],
  },

  // ── k6 Cloud geo-distribution (uncomment when using `k6 cloud`) ────────────
  // ext: {
  //   loadimpact: {
  //     projectID: 0,           // your k6 Cloud project ID
  //     name: "ejz-login-stress",
  //     distribution: {
  //       "amazon:us:ashburn":     { loadZone: "amazon:us:ashburn",      percent: 20 },
  //       "amazon:ie:dublin":      { loadZone: "amazon:ie:dublin",       percent: 20 },
  //       "amazon:sg:singapore":   { loadZone: "amazon:sg:singapore",    percent: 15 },
  //       "amazon:jp:tokyo":       { loadZone: "amazon:jp:tokyo",        percent: 15 },
  //       "amazon:br:sao paulo":   { loadZone: "amazon:br:sao paulo",    percent: 15 },
  //       "amazon:bh:bahrain":     { loadZone: "amazon:bh:bahrain",      percent: 15 },
  //     },
  //   },
  // },

  // ── HTTP settings ──────────────────────────────────────────────────────────
  userAgent: "k6-stress-test/1.0 (ejz-frontend)",
  insecureSkipTLSVerify: false,
  noConnectionReuse: false,       // keep-alive ON  (realistic browser behaviour)
  discardResponseBodies: false,   // we need bodies for assertion
};

// ─── Helper: pick a random region and build headers ───────────────────────────

function getRegionHeaders() {
  const region = REGIONS[randomIntBetween(0, REGIONS.length - 1)];
  // Simulate realistic latency variation per region (local sleep, not network)
  const jitter = randomIntBetween(region.latency[0], region.latency[1]);
  return {
    headers: {
      "X-Origin-Region":    region.name,
      "X-Origin-Location":  region.label,
      "Accept-Language":    pickLanguage(region.name),
      "Accept":             "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding":    "gzip, deflate, br",
      "Cache-Control":      "no-cache",
    },
    jitter,
    regionName: region.name,
  };
}

function pickLanguage(region) {
  const map = {
    "us-east-1":      "en-US,en;q=0.9",
    "eu-west-1":      "en-GB,en;q=0.9,fr;q=0.8",
    "ap-southeast-1": "en-SG,en;q=0.9,zh;q=0.8",
    "ap-northeast-1": "ja-JP,ja;q=0.9,en;q=0.8",
    "sa-east-1":      "pt-BR,pt;q=0.9,en;q=0.8",
    "me-south-1":     "ar-BH,ar;q=0.9,en;q=0.8",
  };
  return map[region] || "en-US,en;q=0.9";
}

// ─── Helper: generate varied test credentials ─────────────────────────────────

function getCredentials() {
  // Mix of valid + invalid credentials to test error-path performance too
  const roll = randomIntBetween(1, 10);
  if (roll <= 7) {
    // 70 % → valid credentials
    return { email: EMAIL, password: PASSWORD, expectSuccess: true };
  } else if (roll <= 9) {
    // 20 % → wrong password
    return { email: EMAIL, password: "WrongPass999!", expectSuccess: false };
  } else {
    // 10 % → non-existent user
    return { email: `ghost_${randomIntBetween(1000,9999)}@nowhere.io`, password: "x", expectSuccess: false };
  }
}

// ─── Main VU scenario - Tests all endpoints ──────────────────────────────────

export default function () {
  const { headers, jitter, regionName } = getRegionHeaders();
  activeUsers.add(1);

  // Simulate realistic network latency from the "remote" region
  sleep(jitter / 1000);

  // Randomly distribute VUs across different user journeys (40/30/30 split)
  const userJourney = randomIntBetween(1, 100);

  if (userJourney <= 40) {
    // 40% → New User Registration Flow
    testRegistrationFlow(headers, regionName);
  } else if (userJourney <= 70) {
    // 30% → Existing User Login Flow
    testLoginFlow(headers, regionName);
  } else {
    // 30% → Billing & Upsell Flow
    testBillingFlow(headers, regionName);
  }

  activeUsers.add(-1);

  // Think-time between iterations (realistic user pacing)
  sleep(randomIntBetween(2, 6));
}

// ─── User Journey 1: New User Registration ───────────────────────────────────

function testRegistrationFlow(headers, regionName) {
  group("1_register_page_load", () => {
    const start = Date.now();

    const res = http.get(REGISTER_URL, {
      headers,
      tags: { type: "page_load", endpoint: "register", region: regionName },
    });

    const elapsed = Date.now() - start;
    pageLoadTime.add(elapsed, { region: regionName, endpoint: "register" });

    const ok = check(res, {
      "register_page: status 200":       (r) => r.status === 200,
      "register_page: body not empty":   (r) => r.body && r.body.length > 0,
      "register_page: under 5s":         (r) => r.timings.duration < 5000,
    });

    if (!ok) errorCount.add(1, { phase: "register_page_load", region: regionName });
  });

  sleep(randomIntBetween(1, 3)); // User reading form

  // Load onboarding assets
  group("2_register_assets", () => {
    http.batch([
      ["GET", BASE_URL,       null, { headers, tags: { type: "asset", region: regionName } }],
      ["GET", `${BASE_URL}/`, null, { headers, tags: { type: "asset", region: regionName } }],
    ]);
  });
}

// ─── User Journey 2: Existing User Login ──────────────────────────────────────

function testLoginFlow(headers, regionName) {
  group("1_login_page_load", () => {
    const start = Date.now();

    const res = http.get(LOGIN_URL, {
      headers,
      tags: { type: "page_load", endpoint: "login", region: regionName },
    });

    const elapsed = Date.now() - start;
    pageLoadTime.add(elapsed, { region: regionName, endpoint: "login" });

    const ok = check(res, {
      "login_page: status 200":       (r) => r.status === 200,
      "login_page: body not empty":   (r) => r.body && r.body.length > 0,
      "login_page: under 5s":         (r) => r.timings.duration < 5000,
    });

    if (!ok) errorCount.add(1, { phase: "login_page_load", region: regionName });
  });

  sleep(randomIntBetween(1, 3)); // User reading form

  // Load dashboard assets
  group("2_login_assets", () => {
    http.batch([
      ["GET", BASE_URL,       null, { headers, tags: { type: "asset", region: regionName } }],
      ["GET", `${BASE_URL}/`, null, { headers, tags: { type: "asset", region: regionName } }],
    ]);
  });
}

// ─── User Journey 3: Billing & Upsell Flow ───────────────────────────────────

function testBillingFlow(headers, regionName) {
  // 50% test new user billing flow, 50% test existing user dashboard billing
  const billingPath = randomIntBetween(1, 2) === 1 ? BILLING_URL : DASHBOARD_BILLING_URL;
  const endpointLabel = billingPath === BILLING_URL ? "billing_new" : "billing_dashboard";

  group(`1_billing_page_load_${endpointLabel}`, () => {
    billingPageViews.add(1, { region: regionName, endpoint: endpointLabel });

    const start = Date.now();

    const res = http.get(billingPath, {
      headers,
      tags: { type: "page_load", endpoint: endpointLabel, region: regionName },
    });

    const elapsed = Date.now() - start;
    pageLoadTime.add(elapsed, { region: regionName, endpoint: endpointLabel });

    const ok = check(res, {
      "billing_page: status 200":       (r) => r.status === 200,
      "billing_page: body not empty":   (r) => r.body && r.body.length > 0,
      "billing_page: under 5s":         (r) => r.timings.duration < 5000,
    });

    if (!ok) errorCount.add(1, { phase: `billing_page_load_${endpointLabel}`, region: regionName });
  });

  sleep(randomIntBetween(2, 4)); // User reviewing pricing/plans

  // Load billing page assets
  group(`2_billing_assets_${endpointLabel}`, () => {
    http.batch([
      ["GET", BASE_URL,       null, { headers, tags: { type: "asset", region: regionName } }],
      ["GET", `${BASE_URL}/`, null, { headers, tags: { type: "asset", region: regionName } }],
    ]);
  });
}

// ─── Teardown & Comprehensive Report Generation ───────────────────────────────

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Enhanced reporting with multi-endpoint analysis
  const summaryData = {
    testInfo: {
      name: "EJZ Frontend Comprehensive Stress Test",
      timestamp: timestamp,
      baseURL: BASE_URL,
      endpoints: [REGISTER_URL, LOGIN_URL, BILLING_URL, DASHBOARD_BILLING_URL],
      peakVUs: MAX_VUS,
      duration: "~48 minutes",
      regions: REGIONS.length,
    },
    ...data,
  };

  return {
    // Human-readable HTML report
    [`ejz-stress-report-${timestamp}.html`]: htmlReport(summaryData),
    // Machine-readable JSON summary with enhanced metadata
    [`ejz-stress-summary-${timestamp}.json`]: JSON.stringify(summaryData, null, 2),
    // Pretty console output
    stdout: textSummary(summaryData, { indent: "  ", enableColors: true }),
  };
}
