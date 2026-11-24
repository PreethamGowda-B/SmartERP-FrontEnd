import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("SEC-02 Remediation: Raw JWT tokens are NEVER stored in browser localStorage or sessionStorage", async (t) => {
  const source = await readFile(new URL("../lib/apiClient.ts", import.meta.url), "utf8");

  await t.test("apiClient defines volatile memoryTokens store", () => {
    assert.match(source, /let\s+memoryTokens\s*:\s*\{/);
    assert.match(source, /userAt:\s*string\s*\|\s*null/);
    assert.match(source, /userRt:\s*string\s*\|\s*null/);
  });

  await t.test("clearLegacyLocalStorageTokens purges sensitive JWT keys", () => {
    assert.match(source, /function\s+clearLegacyLocalStorageTokens\(\)/);
    assert.match(source, /safeLocalStorage\.removeItem\(k\)/);
    assert.match(source, /safeSessionStorage\.removeItem\(k\)/);
  });

  await t.test("setTokens does NOT write raw tokens to localStorage or sessionStorage", () => {
    // In setTokens, safeLocalStorage.setItem(at, accessToken) should NO LONGER be present
    const setTokensMatch = source.match(/export function setTokens\([\s\S]*?\n\}/);
    assert.ok(setTokensMatch, "setTokens function definition found");
    const setTokensBody = setTokensMatch[0];
    
    assert.doesNotMatch(setTokensBody, /safeLocalStorage\.setItem\(at,\s*accessToken\)/);
    assert.doesNotMatch(setTokensBody, /safeLocalStorage\.setItem\(rt,\s*refreshToken\)/);
    assert.doesNotMatch(setTokensBody, /safeLocalStorage\.setItem\("accessToken"/);
    assert.doesNotMatch(setTokensBody, /safeLocalStorage\.setItem\("refreshToken"/);
    assert.doesNotMatch(setTokensBody, /safeSessionStorage\.setItem\(at,\s*accessToken\)/);
    assert.doesNotMatch(setTokensBody, /safeSessionStorage\.setItem\(rt,\s*refreshToken\)/);
    
    // Instead it sets volatile memory and calls clearLegacyLocalStorageTokens
    assert.match(setTokensBody, /memoryTokens\.userAt\s*=\s*accessToken/);
    assert.match(setTokensBody, /clearLegacyLocalStorageTokens\(\)/);
  });

  await t.test("Android WebView bridge is preserved", () => {
    assert.match(source, /\(window\s+as\s+any\)\.Android\.saveToken\(accessToken,\s*refreshToken\)/);
  });

  await t.test("clearTokens purges memory tokens and cleans storage", () => {
    const clearTokensMatch = source.match(/export function clearTokens\([\s\S]*?\n\}/);
    assert.ok(clearTokensMatch, "clearTokens function definition found");
    const clearTokensBody = clearTokensMatch[0];

    assert.match(clearTokensBody, /memoryTokens\.userAt\s*=\s*null/);
    assert.match(clearTokensBody, /clearLegacyLocalStorageTokens\(\)/);
  });
});
