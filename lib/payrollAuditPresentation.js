const STATUS_LABELS = Object.freeze({
  passed: 'Passed',
  warning: 'Warning',
  failed: 'Failed',
  unable_to_validate: 'Unable to validate',
  not_applicable: 'Not applicable',
});

function mapPayrollAuditChecks(checks) {
  if (!Array.isArray(checks)) return [];
  return checks.map((check, index) => ({
    ...check,
    number: index + 1,
    statusLabel: STATUS_LABELS[check.status] || STATUS_LABELS.unable_to_validate,
  }));
}

module.exports = { mapPayrollAuditChecks, STATUS_LABELS };
