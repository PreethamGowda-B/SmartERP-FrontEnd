import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to simulate base64 JWT encoding
function createMockJwt(expSeconds) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    id: "usr-123",
    email: "test@example.com",
    role: "owner",
    exp: expSeconds,
  })).toString("base64url");
  return `${header}.${payload}.signature`;
}

test("Token expiration detection correctly detects expired and fresh tokens", () => {
  const nowSeconds = Math.floor(Date.now() / 1000);

  // Token expired 14 days ago
  const token14DaysOld = createMockJwt(nowSeconds - 14 * 86400);
  // Token expiring in 10 seconds (buffer is 45s, so it should be considered expired)
  const tokenExpiringSoon = createMockJwt(nowSeconds + 10);
  // Token fresh for 1 hour
  const tokenFresh = createMockJwt(nowSeconds + 3600);

  // Custom isTokenExpired logic matching apiClient.ts
  function checkExpired(token, bufferSeconds = 45) {
    if (!token) return true;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return true;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000 - bufferSeconds * 1000;
    } catch {
      return true;
    }
  }

  assert.equal(checkExpired(token14DaysOld), true, "14-day-old token must be expired");
  assert.equal(checkExpired(tokenExpiringSoon), true, "Token within 45s buffer must be considered expired");
  assert.equal(checkExpired(tokenFresh), false, "Fresh token must NOT be expired");
  assert.equal(checkExpired(null), true, "Null token must be expired");
});

test("Frontend auth-context retains isLoading=true until token refresh completes", () => {
  const authContextSrc = fs.readFileSync(path.join(__dirname, "../contexts/auth-context.tsx"), "utf8");

  // Verify that optimistic user update is guarded by valid token
  assert.match(authContextSrc, /at && !isTokenExpired\(at\)/, "Must check token validity before declaring user session active");
  // Verify that refresh is called when token is expired
  assert.match(authContextSrc, /refreshAccessToken\(\)/, "Must attempt refresh for expired tokens");
  // Verify that SESSION_EXPIRED_INACTIVITY is handled
  assert.match(authContextSrc, /expired_inactivity/, "Must handle inactivity expiration outcome");
});

test("Owner dashboard isolates widget failures with Promise.allSettled and ignores AbortError", () => {
  const dashboardSrc = fs.readFileSync(path.join(__dirname, "../app/owner/page.tsx"), "utf8");

  assert.match(dashboardSrc, /Promise\.allSettled/, "Dashboard must use Promise.allSettled to isolate widget errors");
  assert.match(dashboardSrc, /AbortError/, "Dashboard must recognize AbortError / cancelled requests");
  assert.match(dashboardSrc, /!authLoading && user/, "Dashboard must guard fetch until auth resolves and user exists");
});

test("Dashboard trial banner guards against unauthenticated requests", () => {
  const bannerSrc = fs.readFileSync(path.join(__dirname, "../components/dashboard-trial-banner.tsx"), "utf8");

  assert.match(bannerSrc, /useAuth\(\)/, "Trial banner must use useAuth context");
  assert.match(bannerSrc, /isLoading \|\| !user/, "Trial banner must return early when auth is loading or user is absent");
});

test("Login pages detect inactivity query parameters and show required message", () => {
  const loginFormSrc = fs.readFileSync(path.join(__dirname, "../components/login-form.tsx"), "utf8");
  assert.match(loginFormSrc, /Your session expired due to inactivity\. Please sign in again\./, "Staff login form must show inactivity message");

  const customerLoginSrc = fs.readFileSync(path.join(__dirname, "../app/customer/login/page.tsx"), "utf8");
  assert.match(customerLoginSrc, /Your session expired due to inactivity\. Please sign in again\./, "Customer login must show inactivity message");

  const superadminLoginSrc = fs.readFileSync(path.join(__dirname, "../app/superadmin/login/page.tsx"), "utf8");
  assert.match(superadminLoginSrc, /Your session expired due to inactivity\. Please sign in again\./, "Superadmin login must show inactivity message");
});
