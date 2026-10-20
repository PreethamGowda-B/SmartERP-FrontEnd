const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DEFAULT_PLAN, STARTER_FEATURES, STARTER_SUPPORT_POLICY, hasPlanFeature } = require("../lib/subscription-plan-default");
const { formatSupportResponseTarget, getAvailableSupportChannels } = require("../lib/support-policy");

test("frontend fallback is the canonical Starter plan and denies paid-only features", () => {
  assert.deepEqual(DEFAULT_PLAN, {
    id: 1,
    plan_key: "starter",
    name: "Starter",
    is_trial: false,
    days_remaining: 0,
    employee_limit: 10,
    max_inventory_items: 50,
    max_active_jobs: 15,
    max_storage_bytes: 250 * 1024 * 1024,
    features: {
      payroll: false,
      messages: true,
      ai_assistant: false,
      basic_reports: true,
      export_reports: true,
      advanced_reports: false,
      inventory_images: false,
      priority_support: false,
      location_tracking: false,
      ar_collections: false,
      inventory_forecasts: false,
    },
    support_policy: { channels: ["email"], firstResponseBusinessHours: 18 },
  });
  assert.equal(Object.isFrozen(DEFAULT_PLAN), true);
  assert.equal(Object.isFrozen(STARTER_FEATURES), true);
  assert.equal(Object.isFrozen(STARTER_SUPPORT_POLICY), true);
});

test("frontend support presentation follows explicit server policy and fails back to Starter", () => {
  assert.deepEqual(getAvailableSupportChannels(DEFAULT_PLAN.support_policy), ["email"]);
  assert.deepEqual(getAvailableSupportChannels({ channels: ["email", "whatsapp", "phone"] }), ["email", "whatsapp"]);
  assert.equal(formatSupportResponseTarget(DEFAULT_PLAN.support_policy), "within 2 business days");
  assert.equal(formatSupportResponseTarget({ channels: ["email", "whatsapp"], firstResponseBusinessHours: 9 }), "within 1 business day");
  assert.equal(formatSupportResponseTarget({ channels: ["email", "whatsapp"], firstResponseBusinessHours: 4 }), "within 4 business hours");
  assert.deepEqual(getAvailableSupportChannels(undefined), ["email"]);
});

test("support screens consume the server policy and create tracked requests instead of locking Starter", () => {
  const supportView = fs.readFileSync(path.join(__dirname, "../components/support-view.tsx"), "utf8");
  const hrSupport = fs.readFileSync(path.join(__dirname, "../app/hr/support/page.tsx"), "utf8");
  assert.match(supportView, /\/api\/support\/policy/);
  assert.match(supportView, /\/api\/support\/tickets/);
  assert.match(supportView, /method: "POST"/);
  assert.match(supportView, /Submitting here records the request and starts the response-time target/);
  assert.doesNotMatch(supportView, /triggerFeatureLock|Feature Locked/);
  assert.match(hrSupport, /<SupportView \/>/);
});

test("frontend feature checks follow explicit plan flags, not tier labels", () => {
  assert.equal(hasPlanFeature(DEFAULT_PLAN, "ai_assistant"), false);
  assert.equal(hasPlanFeature({ id: 3, name: "Enterprise", features: { payroll: false } }, "payroll"), false);
  assert.equal(hasPlanFeature({ id: 2, name: "Professional", features: { ai_assistant: true } }, "ai_assistant"), true);
  assert.equal(hasPlanFeature({ id: 2, name: "Professional", features: { ar_collections: true } }, "ar_collections"), true);
  assert.equal(hasPlanFeature({ id: 3, name: "Enterprise" }, "location_tracking"), false);
});
