'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('CNC purchase-order page collects and reviews user-provided values before issuing', () => {
  const page = read('app/owner/cnc/vendors/page.tsx');
  assert.match(page, /name="vendor_name"[^>]*required/);
  assert.match(page, /name="parts_description"[^>]*required/);
  assert.match(page, /name="total_cost" type="number" min="0"[^>]*required/);
  assert.match(page, /handleReview/);
  assert.match(page, /Review purchase order/);
  assert.match(page, /Confirm and issue/);
  assert.match(page, /disabled={submitting}/);
  assert.match(page, /res\?\.success/);
  assert.doesNotMatch(page, /Fanuc India Spares Ltd|Spindle Servo Motor 7\.5kW|total_cost: 45000/);
});

test('route-optimization UI does not display defaults or claim successful calculations', () => {
  const page = read('app/owner/cnc/route-optimization/page.tsx');
  assert.match(page, /Optimization unavailable/);
  assert.match(page, /does not calculate, save, or estimate travel routes/);
  assert.doesNotMatch(page, /apiClient|25\.2|66 mins|Dispatch route optimized/);
  assert.match(page, /fuel savings are not available/);
});

test('automation page exposes only the supported action and discloses manual-only status', () => {
  const page = read('app/owner/cnc/automations/page.tsx');
  assert.match(page, /SelectItem value="escalate_priority"/);
  assert.doesNotMatch(page, /SelectItem value="(?:auto_pm|reserve_part|auto_po|notify_owner|notify_manager)"/);
  assert.match(page, /business-event triggers are not connected/);
  assert.match(page, /Saved · manual evaluation only/);
});

test('CNC read screens distinguish errors from empty results and offer retry', () => {
  const vendors = read('app/owner/cnc/vendors/page.tsx');
  const warranty = read('app/owner/cnc/warranty/page.tsx');
  for (const page of [vendors, warranty]) {
    assert.match(page, /role="alert"/);
    assert.match(page, /onClick={fetch/);
    assert.match(page, /No .*records|No purchase orders|No active warranty claims/);
  }
});

test('warranty approval wording describes the recorded amount without claiming a credit note was issued', () => {
  const page = read('app/owner/cnc/warranty/page.tsx');
  const route = fs.readFileSync(path.join(__dirname, '../../SmartERP-BackendEnd/routes/warrantyClaims.js'), 'utf8');
  assert.match(page, /Approve claim \(₹8,500 supplier credit\)/);
  assert.match(page, /supplier credit amount recorded/);
  assert.doesNotMatch(page, /Credit Note issued/i);
  assert.match(route, /Supplier credit amount recorded:/);
  assert.doesNotMatch(route, /Credit Note Issued:/);
});
