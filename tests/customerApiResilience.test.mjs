import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("customer refresh redirects only when the server rejects the refresh credential", async () => {
  const source = await readFile(new URL("../lib/customerApi.ts", import.meta.url), "utf8");

  assert.match(source, /const isRejectedRefresh = refreshStatus === 401 \|\| refreshStatus === 403/);
  assert.match(source, /if \(isRejectedRefresh && typeof window !== 'undefined'\)/);
  assert.match(source, /if \(isRejectedRefresh && typeof window !== 'undefined' && window\.location\.pathname\.startsWith\('\/customer'\)/);
});
