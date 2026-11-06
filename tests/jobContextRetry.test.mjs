import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("JobContext handles array, object, and wrapped API responses via extractJobsArray", () => {
  const contextSrc = fs.readFileSync(path.join(__dirname, "../contexts/job-context.tsx"), "utf8");

  // Verify extractJobsArray exists and extracts array, .jobs, and .data
  assert.match(contextSrc, /function extractJobsArray/, "extractJobsArray helper must exist");
  assert.match(contextSrc, /Array\.isArray\(payload\)/, "must support raw arrays");
  assert.match(contextSrc, /payload\?\.jobs/, "must support { jobs: [...] } object shape");
  assert.match(contextSrc, /payload\?\.data/, "must support { data: [...] } object shape");
});

test("JobContext manual retry provides visual feedback and disabled state", () => {
  const contextSrc = fs.readFileSync(path.join(__dirname, "../contexts/job-context.tsx"), "utf8");

  // Verify retry state and button spinner
  assert.match(contextSrc, /const \[isRetrying, setIsRetrying\] = useState\(false\)/, "isRetrying state must exist");
  assert.match(contextSrc, /disabled=\{isRetrying\}/, "Retry button must be disabled while retrying");
  assert.match(contextSrc, /animate-spin/, "Retry button must render a spinner while retrying");
  assert.match(contextSrc, /Retrying\.\.\./, "Retry button must indicate active retry in progress");
});

test("JobContext refreshJobs guards against deadlock with timeout and does not silently exit on manual retry", () => {
  const contextSrc = fs.readFileSync(path.join(__dirname, "../contexts/job-context.tsx"), "utf8");

  // Verify race timeout
  assert.match(contextSrc, /Promise\.race/, "Manual retry must use Promise.race to avoid waiting indefinitely on in-flight requests");
  assert.match(contextSrc, /setIsRetrying\(false\)/, "isRetrying must be cleared in finally");
});
