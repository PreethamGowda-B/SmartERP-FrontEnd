import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("connection notice distinguishes offline, degraded, and service-unavailable states", async () => {
  const source = await readFile(new URL("../components/slow-network-notice.tsx", import.meta.url), "utf8");

  assert.match(source, /"Connection is unstable\. Some data may take longer to load\."/);
  assert.match(source, /"You are offline\. Your current data is preserved until you reconnect\."/);
  assert.match(source, /"SmartERP service is temporarily unavailable\. Please retry shortly\."/);
  assert.match(source, /window\.addEventListener\("offline"/);
  assert.match(source, /window\.addEventListener\("online"/);
});

test("API client reports genuine offline failures and 5xx availability failures without logging out", async () => {
  const source = await readFile(new URL("../lib/apiClient.ts", import.meta.url), "utf8");

  assert.match(source, /triggerNetworkNotice\("offline"\)/);
  assert.match(source, /triggerNetworkNotice\("degraded"\)/);
  assert.match(source, /triggerNetworkNotice\("service-unavailable"\)/);
  assert.doesNotMatch(source, /triggerNetworkNotice\([^\n]*handleLogout/);
});
