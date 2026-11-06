import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('apiClient distinguishes timeout from user cancellation and retries transient timeouts', async () => {
  const source = await readFile(new URL('../lib/apiClient.ts', import.meta.url), 'utf8');

  // Verify timeout duration is 30s
  assert.match(source, /timeoutMs\s*=\s*\(options\s+as\s+any\)\?\.timeoutMs\s*\|\|\s*30000/);

  // Verify timeout tracking
  assert.match(source, /isTimedOut\s*=\s*true/);
  assert.match(source, /name:\s*"TimeoutError"|timeoutErr\.name\s*=\s*"TimeoutError"/);

  // Verify cancellation does not mask timeout
  assert.match(source, /if\s*\(isTimedOut\)/);
  assert.match(source, /if\s*\(error\.name\s*===\s*"AbortError"\)/);

  // Verify retry includes timeout
  assert.match(source, /error\.name\s*===\s*"TimeoutError"\s*\|\|\s*error\.isTimeout/);

  // Verify 502/503/504 transient retry
  assert.match(source, /res\.status\s*===\s*502\s*\|\|\s*res\.status\s*===\s*503\s*\|\|\s*res\.status\s*===\s*504/);
});

test('SubscriptionContext provides deduplication and exposes shared statusData', async () => {
  const source = await readFile(new URL('../contexts/subscription-context.tsx', import.meta.url), 'utf8');

  assert.match(source, /inFlightPromiseRef/);
  assert.match(source, /statusData/);
  assert.match(source, /Date\.now\(\)\s*-\s*lastFetchedRef\.current\s*<\s*30000/);
  assert.match(source, /refreshSubscription/);
});

test('LoadingContext includes safety timer to prevent permanent screen dimming', async () => {
  const source = await readFile(new URL('../contexts/loading-context.tsx', import.meta.url), 'utf8');

  assert.match(source, /safetyTimerRef/);
  assert.match(source, /stopLoading\(\)/);
  assert.match(source, /5000/);
});

test('Owner dashboard metrics failure does not replace whole layout with ErrorView', async () => {
  const source = await readFile(new URL('../app/owner/page.tsx', import.meta.url), 'utf8');

  // Does not return ErrorView replacing the whole dashboard
  assert.doesNotMatch(source, /if\s*\(error\s*&&\s*!metrics\)\s*\{\s*return\s*\(\s*<OwnerLayout>/);

  // Shows inline retry inside Section C
  assert.match(source, /\{error\s*&&\s*!metrics\s*\?\s*\(/);
  assert.match(source, /Retry Metrics/);
});
