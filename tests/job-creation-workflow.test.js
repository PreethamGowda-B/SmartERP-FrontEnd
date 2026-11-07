'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');

test('JobForm prevents duplicate submission, sets loading state, and renders error alert on failure', () => {
  const form = read('components/job-form.tsx');

  // Submit button displays loading state and is disabled while busy
  assert.match(form, /disabled=\{Boolean\(isLoading \|\| isSubmitting\)\}/);
  assert.match(form, /isLoading \|\| isSubmitting \? \([\s\S]*?<Loader2/);
  assert.match(form, /\{job \? "Updating\.\.\." : "Creating\.\.\."\}/);

  // Form submission handler guards against in-flight duplicates
  assert.match(form, /const submitLockRef = useRef\(false\)/);
  assert.match(form, /if \(submitLockRef\.current \|\| isSubmitting \|\| isLoading\) return/);
  assert.match(form, /submitLockRef\.current = true/);
  assert.match(form, /submitLockRef\.current = false/);
  assert.match(form, /role="status" aria-live="polite"/);

  // Form catches failure, preserves entered form details, and displays readable error
  assert.match(form, /const \[submitError, setSubmitError\] = useState<string \| null>\(null\)/);
  assert.match(form, /setSubmitError\(msg\)/);
  assert.match(form, /\{submitError && \(/);
  assert.match(form, /<AlertCircle/);
  assert.match(form, /\{submitError\}/);
  assert.match(form, /role="alert" aria-live="assertive"/);
});

test('OwnerJobsPage automatically closes form, activates Tasks tab, resets filters, and refreshes job list on success', () => {
  const page = read('app/owner/jobs/page.tsx');
  const submitStart = page.indexOf('const handleSubmitJob = async');
  const submitEnd = page.indexOf('const checkIsCustomerJob', submitStart);
  const submitFlow = page.slice(submitStart, submitEnd);

  // Success flow in handleSubmitJob
  assert.match(page, /toast\.success\(editingJob \? "Job updated successfully\." : "Job created successfully\."\)/);
  assert.match(page, /setIsFormOpen\(false\)/);
  assert.match(page, /setEditingJob\(null\)/);
  assert.match(page, /setActiveTab\("all"\)/, 'Must activate the Tasks tab (all) after creation');
  assert.match(page, /setStatusFilter\("all"\)/, 'Must reset status filter so newly created job is visible');
  assert.match(page, /setEmployeeStatusFilter\("all"\)/, 'Must reset employee filter so newly created job is visible');
  assert.match(page, /await refreshJobs\(\)/, 'Must immediately refresh jobs from the backend');
  assert.match(page, /const jobSubmitLockRef = useRef\(false\)/);
  assert.match(page, /if \(jobSubmitLockRef\.current\) return/);
  assert.match(page, /router\.replace\("\/owner\/jobs", \{ scroll: false \}\)/, 'Creation removes stale view/action query and returns to Tasks');
  assert.ok(submitFlow.indexOf('toast.success(editingJob ?') < submitFlow.indexOf('await refreshJobs()'), 'Success feedback must not wait for the follow-up list request');
  assert.ok(submitFlow.indexOf('setIsFormOpen(false)') < submitFlow.indexOf('await refreshJobs()'), 'The form closes as soon as the API confirms success');

  // Failure flow in handleSubmitJob
  assert.match(page, /catch \(err: any\) \{/);
  assert.match(page, /setFormError\(message\)/);
  assert.match(page, /toast\.error\(message\)/);
  assert.match(page, /throw err/, 'Must rethrow so JobForm can catch and display in form error alert');
  assert.match(page, /successfulFormCloseRef\.current = true/);
  assert.match(page, /if \(!open && isSubmitting && !successfulFormCloseRef\.current\) return/, 'Dismissal cannot hide an in-flight create request');

  // Form Dialog passes error and handles cancellation
  assert.match(page, /error=\{formError\}/);
  assert.match(page, /onCancel=\{\(\) => \{ setIsFormOpen\(false\); setEditingJob\(null\); setFormError\(null\) \}\}/);
});

test('JobContext normalizes newly added jobs so fields are immediately available before refresh', () => {
  const context = read('contexts/job-context.tsx');

  assert.match(context, /const normalizedJob: Job = \{/);
  assert.match(context, /client: savedJob\.client \|\| savedJob\.data\?\.client \|\| job\.client/);
  assert.match(context, /location: savedJob\.location \|\| savedJob\.data\?\.location \|\| job\.location/);
  assert.match(context, /startDate: savedJob\.startDate \|\| savedJob\.data\?\.startDate \|\| job\.startDate/);
  assert.match(context, /endDate: savedJob\.endDate \|\| savedJob\.data\?\.endDate \|\| job\.endDate/);
  assert.match(context, /budget: Number\(savedJob\.budget \?\? savedJob\.data\?\.budget \?\? job\.budget \?\? 0\)/);
});
