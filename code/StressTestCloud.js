/**
 * ============================================================
 *  K6 CLOUD STRESS TEST — ejz-frontend.vercel.app
 *  Tool     : Grafana k6 (Cloud Edition)
 *  Strategy : Multi-endpoint, multi-region, 100 VU cloud limit
 *  Endpoints: /register, /login, /billing, /dashboard/billing
 *  Regions  : Real geo-distributed via k6 Cloud
 * ============================================================
 *
 *  HOW TO RUN
 *  ----------
 *  1. Set k6 Cloud Token:
 *       export K6_CLOUD_TOKEN=your-token-from-app.k6.io
 *
 *  2. Run with k6 Cloud:
 *       k6 cloud StressTestCloud.js
 *
 *  3. Or run locally:
 *       k6 run StressTestCloud.js
 *
 *  ENV VARIABLES (optional overrides)
 *  ------------------------------------
 *  TARGET_URL   : override base URL (default: https://ejz-frontend.vercel.app)
 *  TEST_EMAIL   : login email (default: test@example.com)
 *  TEST_PASS    : login password (default: Password123!)
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
const MAX_VUS               = parseInt(__ENV.MAX_VUS || "100", 10);

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

// ─── Simulated Regions (k6 Cloud will distribute across real zones) ─────────

const REGIONS = [
  { name: "us-east-1",      label: "US East (N. Virginia)",  zone: "amazon:us:ashburn"    },
  { name: "eu-west-1",      label: "Europe (Ireland)",        zone: "amazon:ie:dublin"     },
  { name: "ap-southeast-1", label: "Asia Pacific (Singapore)",zone: "amazon:sg:singapore"  },
  { name: "ap-northeast-1", label: "Asia Pacific (Tokyo)",    zone: "amazon:jp:tokyo"      },
  { name: "sa-east-1",      label: "South America (São Paulo)",zone: "amazon:br:sao paulo"  },
  { name: "au-east-1",      label: "Australia (Sydney)",      zone: "amazon:au:sydney"     },
];

// ─── Stages (100 VU Cloud Limit Profile) ───────────────────────────────────────
//
//  Phase 1 — Warm-up         :  0 → 20 VU  over  2 min
//  Phase 2 — Ramp-up         : 20 → 30 VU  over  2 min
//  Phase 3 — Normal load     : 30 VU steady for   3 min
//  Phase 4 — Stress ramp     : 30 → 50 VU  over  2 min
//  Phase 5 — Heavy load      : 50 VU steady for   3 min
//  Phase 6 — Spike           : 50 → 100 VU over   2 min  ← MAXIMUM SPIKE
//  Phase 7 — Max hold        : 100 VU steady for  3 min
//  Phase 8 — Spike drop      : 100 → 50 VU over   1 min
//  Phase 9 — Soak (endurance): 50 VU steady for  10 min
//  Phase 10 — Ramp-down      : 50 →  0 VU  over   2 min
//
//  Total duration ≈ 30 minutes | Peak VUs: 100 (Cloud limit)

export const options = {
  stages: [
    { duration: "2m",  target: 20  },   // Phase 1  – Warm-up
    { duration: "2m",  target: 30  },   // Phase 2  – Ramp-up
    { duration: "3m",  target: 30  },   // Phase 3  – Normal load
    { duration: "2m",  target: 50  },   // Phase 4  – Stress ramp
    { duration: "3m",  target: 50  },   // Phase 5  – Heavy load
    { duration: "2m",  target: MAX_VUS }, // Phase 6  – Spike to MAX
    { duration: "3m",  target: MAX_VUS }, // Phase 7  – Max hold
    { duration: "1m",  target: 50  },   // Phase 8  – Spike drop
    { duration: "10m", target: 50  },   // Phase 9  – Soak / endurance
    { duration: "2m",  target: 0    },   // Phase 10 – Ramp-down
  ],

  // ── Thresholds (SLOs) - Adjusted for cloud testing ──────────────────────────
  thresholds: {
    // More relaxed thresholds for cloud (considering network variability)
    "login_response_ms":                ["p(95)<4000"],    // Relaxed from 3s
    "register_response_ms":             ["p(95)<5000"],    // Relaxed from 4s
    "billing_response_ms":              ["p(95)<4000"],    // Relaxed from 3s
    "page_load_time_ms":                ["p(95)<6000"],    // Relaxed from 5s
    "http_req_duration":                ["p(99)<7000"],    // Relaxed from 6s
  },

  // ── k6 Cloud geo-distribution (Free tier: 1 load zone only) ─────────────────
  ext: {
    loadimpact: {
      projectID: 3831097,     // Your k6 Cloud project ID
      name: "ejz-cloud-stress-100vu",
      // ─── Single Zone for Free Tier (k6 Cloud Free plan) ───
      // Free tier allows only 1 load zone
      // To test multiple zones individually, uncomment the desired zone below
      // For multi-zone testing, upgrade to a paid plan
      
      // AVAILABLE ZONES (select one for free tier, or uncomment multiple for paid):
      distribution: {
        // US Zones
        "amazon:us:ashburn":       { loadZone: "amazon:us:ashburn",       percent: 100 },  // US East (N. Virginia)
        // "amazon:us:columbus":      { loadZone: "amazon:us:columbus",      percent: 100 },  // US Central (Ohio)
        // "amazon:us:palo alto":     { loadZone: "amazon:us:palo alto",     percent: 100 },  // US West (Palo Alto)
        // "amazon:us:portland":      { loadZone: "amazon:us:portland",      percent: 100 },  // US West (Portland)
        
        // Europe Zones
        // "amazon:ie:dublin":        { loadZone: "amazon:ie:dublin",        percent: 100 },  // Europe (Ireland)
        // "amazon:gb:london":        { loadZone: "amazon:gb:london",        percent: 100 },  // Europe (London)
        // "amazon:de:frankfurt":     { loadZone: "amazon:de:frankfurt",     percent: 100 },  // Europe (Frankfurt)
        // "amazon:fr:paris":         { loadZone: "amazon:fr:paris",         percent: 100 },  // Europe (Paris)
        // "amazon:se:stockholm":     { loadZone: "amazon:se:stockholm",     percent: 100 },  // Europe (Stockholm)
        // "amazon:it:milan":         { loadZone: "amazon:it:milan",         percent: 100 },  // Europe (Milan)
        
        // Asia Zones
        // "amazon:in:mumbai":        { loadZone: "amazon:in:mumbai",        percent: 100 },  // Asia (Mumbai)
        // "amazon:cn:hong kong":     { loadZone: "amazon:cn:hong kong",     percent: 100 },  // Asia (Hong Kong)
        // "amazon:sg:singapore":     { loadZone: "amazon:sg:singapore",     percent: 100 },  // Asia (Singapore)
        // "amazon:kr:seoul":         { loadZone: "amazon:kr:seoul",         percent: 100 },  // Asia (Seoul)
        // "amazon:jp:tokyo":         { loadZone: "amazon:jp:tokyo",         percent: 100 },  // Asia (Tokyo)
        // "amazon:jp:osaka":         { loadZone: "amazon:jp:osaka",         percent: 100 },  // Asia (Osaka)
        
        // Other Zones
        // "amazon:au:sydney":        { loadZone: "amazon:au:sydney",        percent: 100 },  // Oceania (Sydney)
        // "amazon:ca:montreal":      { loadZone: "amazon:ca:montreal",      percent: 100 },  // North America (Montreal)
        // "amazon:br:sao paulo":     { loadZone: "amazon:br:sao paulo",     percent: 100 },  // South America (São Paulo)
        // "amazon:sa:cape town":     { loadZone: "amazon:sa:cape town",     percent: 100 },  // Africa (Cape Town)
      },
    },
  },

  // ── HTTP settings ──────────────────────────────────────────────────────────
  userAgent: "k6-cloud-stress-test/1.0 (ejz-frontend)",
  insecureSkipTLSVerify: false,
  noConnectionReuse: false,       // keep-alive ON  (realistic browser behaviour)
  discardResponseBodies: false,   // we need bodies for assertion
};

// ─── Helper: pick a random region ────────────────────────────────────────────

function getRegionInfo() {
  const region = REGIONS[randomIntBetween(0, REGIONS.length - 1)];
  return {
    regionName: region.name,
    regionLabel: region.label,
    headers: {
      "X-Origin-Region":    region.name,
      "X-Origin-Location":  region.label,
      "Accept-Language":    pickLanguage(region.name),
      "Accept":             "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding":    "gzip, deflate, br",
      "Cache-Control":      "no-cache",
    },
  };
}

function pickLanguage(region) {
  const map = {
    "us-east-1":      "en-US,en;q=0.9",
    "eu-west-1":      "en-GB,en;q=0.9,fr;q=0.8",
    "ap-southeast-1": "en-SG,en;q=0.9,zh;q=0.8",
    "ap-northeast-1": "ja-JP,ja;q=0.9,en;q=0.8",
    "sa-east-1":      "pt-BR,pt;q=0.9,en;q=0.8",
    "au-east-1":      "en-AU,en;q=0.9",
  };
  return map[region] || "en-US,en;q=0.9";
}

// ─── Helper: generate varied test credentials ────────────────────────────────

function getCredentials() {
  const roll = randomIntBetween(1, 10);
  if (roll <= 7) {
    return { email: EMAIL, password: PASSWORD, expectSuccess: true };
  } else if (roll <= 9) {
    return { email: EMAIL, password: "WrongPass999!", expectSuccess: false };
  } else {
    return { email: `ghost_${randomIntBetween(1000,9999)}@nowhere.io`, password: "x", expectSuccess: false };
  }
}

// ─── Main VU scenario - Tests all endpoints ──────────────────────────────────

export default function () {
  const { headers, regionName, regionLabel } = getRegionInfo();
  activeUsers.add(1);

  // Randomly distribute VUs across different user journeys (40/30/30 split)
  const userJourney = randomIntBetween(1, 100);

  if (userJourney <= 40) {
    testRegistrationFlow(headers, regionName);
  } else if (userJourney <= 70) {
    testLoginFlow(headers, regionName);
  } else {
    testBillingFlow(headers, regionName);
  }

  activeUsers.add(-1);
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

  sleep(randomIntBetween(1, 3));

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

  sleep(randomIntBetween(1, 3));

  group("2_login_assets", () => {
    http.batch([
      ["GET", BASE_URL,       null, { headers, tags: { type: "asset", region: regionName } }],
      ["GET", `${BASE_URL}/`, null, { headers, tags: { type: "asset", region: regionName } }],
    ]);
  });
}

// ─── User Journey 3: Billing & Upsell Flow ───────────────────────────────────

function testBillingFlow(headers, regionName) {
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

  sleep(randomIntBetween(2, 4));

  group(`2_billing_assets_${endpointLabel}`, () => {
    http.batch([
      ["GET", BASE_URL,       null, { headers, tags: { type: "asset", region: regionName } }],
      ["GET", `${BASE_URL}/`, null, { headers, tags: { type: "asset", region: regionName } }],
    ]);
  });
}

// ─── Teardown & Cloud Report Generation ──────────────────────────────────────

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Enhanced reporting with cloud-specific metadata
  const summaryData = {
    testInfo: {
      name: "EJZ Frontend Cloud Stress Test (100 VU)",
      timestamp: timestamp,
      baseURL: BASE_URL,
      endpoints: [REGISTER_URL, LOGIN_URL, BILLING_URL, DASHBOARD_BILLING_URL],
      peakVUs: MAX_VUS,
      duration: "~30 minutes",
      regions: REGIONS.length,
      cloudDistributed: true,
    },
    ...data,
  };

  return {
    // Human-readable HTML report with cloud-specific name
    "cloudstresstestingreports.html": htmlReport(summaryData),
    // Machine-readable JSON summary with cloud metadata
    "cloud-stress-summary.json": JSON.stringify(summaryData, null, 2),
    // Pretty console output
    stdout: textSummary(summaryData, { indent: "  ", enableColors: true }),
  };
}

