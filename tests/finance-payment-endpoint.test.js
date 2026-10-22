'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('finance payment ledger posts to the authenticated record endpoint with its expected payload', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'components', 'payments-view.tsx'), 'utf8');

  assert.match(source, /apiClient<[^>]+>\("\/api\/finance\/payments\/record",\s*\{\s*method:\s*"POST"/s);
  assert.match(source, /invoiceId:\s*selectedInvoiceId/);
  assert.match(source, /paymentMethod,\s*transactionReference:\s*transactionRef/);
  assert.doesNotMatch(source, /apiClient[^\n]*\("\/api\/finance\/payments",\s*\{\s*method:\s*"POST"/);
});
