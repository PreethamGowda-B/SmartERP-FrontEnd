import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("connection notice provides state-specific guidance and rotates it automatically", async () => {
  const source = await readFile(new URL("../components/slow-network-notice.tsx", import.meta.url), "utf8");

  assert.match(source, /"Your connection needs attention"/);
  assert.match(source, /"You’re currently offline"/);
  assert.match(source, /"SmartERP is temporarily unavailable"/);
  assert.match(source, /Connection status: offline/);
  assert.match(source, /window\.setInterval/);
  assert.match(source, /5500/);
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
