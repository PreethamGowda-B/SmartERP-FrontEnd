import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isOfflineFetchFailure } from '../lib/api-network-status.mjs';

test('offline browser hint only classifies an actual failed fetch as offline', () => {
  assert.equal(isOfflineFetchFailure(new TypeError('Failed to fetch'), true), true);
  assert.equal(isOfflineFetchFailure(new TypeError('Failed to fetch'), false), false);
  assert.equal(isOfflineFetchFailure(Object.assign(new Error('HTTP 503'), { status: 503 }), true), false);
  assert.equal(isOfflineFetchFailure(Object.assign(new Error('HTTP 400'), { status: 400 }), true), false);
});

test('API client attempts fetch even when the browser offline hint is false', async () => {
  const source = await readFile(new URL('../lib/apiClient.ts', import.meta.url), 'utf8');
  assert.match(source, /res\s*=\s*await fetch\(/);
  assert.doesNotMatch(source, /if\s*\([^)]*!navigator\.onLine[^)]*\)\s*\{\s*throw/);
  assert.match(source, /isOfflineFetchFailure\(error, deviceReportsOffline\)/);
  assert.match(source, /if\s*\(error\.status\s*\|\|\s*error\.message\?\.includes\("internet connection"\)\)\s*\{\s*throw error/);
});
