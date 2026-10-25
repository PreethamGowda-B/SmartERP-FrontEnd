import test from "node:test";
import assert from "node:assert/strict";
import {
  isProtectedRequestAuthFailure,
  isRejectedRefreshResponse,
  isSameAuthSession,
  resolveAuthScope,
  withAuthRefreshLock,
} from "../lib/auth-session.mjs";

test("Owner AI requests use the Owner session namespace", () => {
  assert.equal(resolveAuthScope({ targetPath: "/api/ai/agent", pathname: "/owner" }), "user");
});

test("Superadmin AI requests use the active Superadmin page namespace", () => {
  assert.equal(resolveAuthScope({ targetPath: "/api/ai/agent", pathname: "/superadmin/system-health", hostname: "superadmin.prozync.in" }), "admin");
  assert.equal(resolveAuthScope({ targetPath: "/api/ai/agent", pathname: "/superadmin/system-health", hostname: "www.prozync.in" }), "user");
  assert.equal(resolveAuthScope({ targetPath: "/api/superadmin/users", pathname: "/owner" }), "admin");
  assert.equal(resolveAuthScope({ targetPath: "/api/administer/users", pathname: "/owner" }), "user");
});

test("Successful AI attendance responses do not trigger session invalidation", () => {
  assert.equal(isProtectedRequestAuthFailure(200), false);
});

test("AI tool errors and authorization denials do not trigger logout", () => {
  assert.equal(isProtectedRequestAuthFailure(403), false);
  assert.equal(isProtectedRequestAuthFailure(500), false);
  assert.equal(isProtectedRequestAuthFailure(503), false);
  assert.equal(isRejectedRefreshResponse(503), false);
});

test("A genuine protected-resource 401 is handled as an authentication failure", () => {
  assert.equal(isProtectedRequestAuthFailure(401), true);
  assert.equal(isRejectedRefreshResponse(401), true);
  assert.equal(isRejectedRefreshResponse(403), true);
});

test("A stale refresh result cannot invalidate a newer valid session", () => {
  assert.equal(isSameAuthSession({
    expectedAccessToken: "old-access",
    expectedRefreshToken: "old-refresh",
    currentAccessToken: "new-access",
    currentRefreshToken: "new-refresh",
  }), false);
  assert.equal(isSameAuthSession({
    expectedAccessToken: "same-access",
    expectedRefreshToken: "same-refresh",
    currentAccessToken: "same-access",
    currentRefreshToken: "same-refresh",
  }), true);
});

test("a delayed AI 401 cannot invalidate a newer Owner session", () => {
  assert.equal(isSameAuthSession({
    expectedAccessToken: "ai-request-access",
    expectedRefreshToken: "ai-request-refresh",
    currentAccessToken: "new-owner-access",
    currentRefreshToken: "new-owner-refresh",
  }), false);
});

test("refresh requests serialize across browser tabs when Web Locks are available", async () => {
  const tails = new Map();
  const lockManager = {
    request(name, options, callback) {
      assert.equal(name, "smarterp:auth-refresh:_rt");
      assert.deepEqual(options, { mode: "exclusive" });
      const previous = tails.get(name) || Promise.resolve();
      let release;
      const current = new Promise((resolve) => { release = resolve; });
      tails.set(name, current);
      return previous.then(callback).finally(release);
    },
  };
  let active = 0;
  let maxActive = 0;
  const refresh = (label) => withAuthRefreshLock("_rt", async () => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return label;
  }, lockManager);

  const results = await Promise.all([refresh("tab-a"), refresh("tab-b")]);
  assert.deepEqual(results, ["tab-a", "tab-b"]);
  assert.equal(maxActive, 1);
});
