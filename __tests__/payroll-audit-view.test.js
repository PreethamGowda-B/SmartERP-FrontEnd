const test = require('node:test');
const assert = require('node:assert/strict');
const { mapPayrollAuditChecks } = require('../lib/payrollAuditPresentation');

test('renders all seven server check statuses and explanations without inventing passed states', () => {
  const checks = [
    'unable_to_validate', 'warning', 'failed', 'passed',
    'unable_to_validate', 'failed', 'warning',
  ].map((status, index) => ({ id: `check-${index + 1}`, status, label: `Check ${index + 1}`, records_examined: index, explanation: `server result ${index + 1}` }));
  const displayed = mapPayrollAuditChecks(checks);
  assert.equal(displayed.length, 7);
  assert.deepEqual(displayed.map((check) => check.status), checks.map((check) => check.status));
  assert.deepEqual(displayed.map((check) => check.number), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(displayed[0].statusLabel, 'Unable to validate');
  assert.equal(displayed[3].statusLabel, 'Passed');
  assert.equal(displayed[0].explanation, 'server result 1');
  assert.equal(mapPayrollAuditChecks(undefined).length, 0);
  assert.equal(mapPayrollAuditChecks([{ id: 'unknown', status: 'unknown', label: 'Unknown' }])[0].statusLabel, 'Unable to validate');
});
