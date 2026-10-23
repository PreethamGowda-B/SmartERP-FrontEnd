'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = (relative) => fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');

test('owner report failures do not become fabricated successful metrics', () => {
  const page = source('app/owner/reports/page.tsx');
  assert.match(page, /fetchReport\("attendance", p\)/);
  assert.doesNotMatch(page, /total_hours:\s*160|completed:\s*12,\s*total:\s*15|total_items:\s*24/);
  assert.match(page, /setError\(e\.message \|\| "Failed to load report data"\)/);
  assert.match(page, /!loading && !error && attendance && jobs && employees && materials && inventory/);
});

test('CNC placeholder exports do not tell users that a file was exported', () => {
  const page = source('app/owner/cnc/reports/page.tsx');
  assert.doesNotMatch(page, /toast\.success\(`Exported/);
  assert.match(page, /no connected data\/export endpoint yet/);
});

test('roster UI does not fabricate default employee schedules or claim unsaved changes were published', () => {
  const page = source('app/hr/roster/page.tsx');
  assert.doesNotMatch(page, /dayIdx === 5 \|\| dayIdx === 6/);
  assert.match(page, /emp\.assignments && typeof emp\.assignments === "object"/);
  assert.match(page, /Shift changes were not saved/);
  assert.match(page, /Roster was not published/);
  assert.match(page, /Not configured/);
});

test('job context waits for persisted create, update, and delete responses before changing local state', () => {
  const context = source('contexts/job-context.tsx');
  for (const operation of ['addJob', 'updateJob', 'deleteJob']) {
    const start = context.indexOf(`const ${operation} = useCallback(async`);
    assert.notEqual(start, -1, `${operation} must be asynchronous and await the API`);
    const next = context.indexOf('\n\n  const ', start + 1);
    const body = context.slice(start, next === -1 ? context.length : next);
    assert.match(body, /await apiClient/);
  }
  assert.doesNotMatch(context, /best-effort (?:update|persist) to backend/);
  assert.doesNotMatch(context, /addNotification\(/);
});

test('notification state is reset and stale fetches ignored when the authenticated company/account changes', () => {
  const context = source('contexts/notification-context.tsx');
  assert.match(context, /notificationOwnerKey = user[\s\S]*companyId[\s\S]*company_id/);
  assert.match(context, /notificationOwnerKeyRef\.current = notificationOwnerKey/);
  assert.match(context, /seenNotificationIdsRef\.current\.clear\(\)/);
  assert.match(context, /if \(notificationOwnerKeyRef\.current !== notificationOwnerKey\) return/);
});

test('approval center uses persisted work requests and does not seed or optimistically approve demo rows', () => {
  const component = source('components/approval-center.tsx');
  assert.match(component, /useState<ApprovalItem\[]>\(\[\]\)/);
  assert.match(component, /\/api\/work-requests\?status=all/);
  assert.match(component, /\/api\/work-requests\/\$\{encodeURIComponent\(id\)\}\/action/);
  assert.match(component, /if \(!result\?\.success\) throw/);
  assert.doesNotMatch(component, /id:\s*"app-[0-9]+"/);
  assert.match(component, /setLoadError/);
});

test('job action submission creates only one canonical work request and waits for its success', () => {
  const component = source('components/job-actions-modal.tsx');
  assert.match(component, /await apiClient\(`\/api\/work-requests`/);
  assert.doesNotMatch(component, /\/api\/jobs\/\$\{jobId\}\/actions/);
  assert.match(component, /toast\.success\(/);
  assert.match(component, /catch \(err: any\)[\s\S]*toast\.error/);
});

test('legacy tax invoice preview does not fabricate official invoice details or allow printing', () => {
  const component = source('components/gst-invoice-modal.tsx');
  assert.match(component, /not connected to a saved invoice/);
  assert.doesNotMatch(component, /Acme Construction|Math\.random|customerGstin|lineItems|handlePrint/);
});

test('owner dashboard does not turn a failed approvals request into a verified zero count', () => {
  const page = source('app/owner/page.tsx');
  assert.match(page, /approvalLoadError/);
  assert.match(page, /Array\.isArray\(approvalResult\.data\?\.requests\)/);
  assert.match(page, /pendingApprovals !== null/);
  assert.doesNotMatch(page, /work-requests\?status=pending"\)\.catch\(\(\) => \(\{ requests: \[\] \}\)\)/);
});
