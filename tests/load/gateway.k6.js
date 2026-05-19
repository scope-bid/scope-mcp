// k6 load test for the Scope MCP gateway.
//
// Targets the GET /mcp/v1/tools endpoint - a read-only call that
// exercises auth, request routing, and upstream forward to scope.bid.
// Holds 100 VUs for the configured duration with a brief ramp on
// either side. p95 thresholded at 500ms; the workflow fails if the
// gateway exceeds that under steady load.
//
// Env (set by .github/workflows/load-test.yml):
//   TARGET_URL        gateway base URL, no trailing slash
//   SCOPE_API_TOKEN   bearer token the gateway accepts
//   DURATION_MINUTES  sustained-load minutes (default 5)

import http from "k6/http";
import { check, sleep } from "k6";

const TARGET = __ENV.TARGET_URL || "http://localhost:8080";
const TOKEN = __ENV.SCOPE_API_TOKEN || "test-token";
const HOLD_MIN = Number(__ENV.DURATION_MINUTES || "5");

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: `${HOLD_MIN}m`, target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(`${TARGET}/mcp/v1/tools`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  check(res, {
    "status is 200": (r) => r.status === 200,
    "has tools array": (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).tools);
      } catch {
        return false;
      }
    },
  });
  sleep(0.1);
}
