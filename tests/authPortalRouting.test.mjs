import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("staff OAuth callback failures return to the staff login rather than /login", async () => {
  const source = await readFile(new URL("../app/auth/callback/page.tsx", import.meta.url), "utf8");

  assert.match(source, /onSuperAdminHost \? "\/superadmin\/login" : "\/auth\/login"/);
  assert.doesNotMatch(source, /onSuperAdminHost \? "\/superadmin\/login" : "\/login"/);
});

test("legacy /login URLs are canonicalized before the dynamic admin route", async () => {
  const source = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");

  assert.match(source, /pathname === "\/login"/);
  assert.match(source, /onSuperAdminHost \? "\/superadmin\/login" : "\/auth\/login"/);
});

test("staff logout keeps the portal context on the shared staff login", async () => {
  const source = await readFile(new URL("../lib/apiClient.ts", import.meta.url), "utf8");

  assert.match(source, /pathname\.startsWith\("\/employee"\) \? "employee"/);
  assert.match(source, /pathname\.startsWith\("\/hr"\) \? "hr"/);
  assert.match(source, /\/auth\/login\$\{queryParam\}/);
});

test("AI requests do not trigger a global slow-network warning", async () => {
  const source = await readFile(new URL("../lib/apiClient.ts", import.meta.url), "utf8");

  assert.match(source, /markRequestStart\(requestId, !path\.startsWith\("\/api\/ai\/"\)\)/);
});
