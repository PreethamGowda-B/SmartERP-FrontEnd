const test = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_PLAN, STARTER_FEATURES, hasPlanFeature } = require("../lib/subscription-plan-default");

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
  });
  assert.equal(Object.isFrozen(DEFAULT_PLAN), true);
  assert.equal(Object.isFrozen(STARTER_FEATURES), true);
});

test("frontend feature checks follow explicit plan flags, not tier labels", () => {
  assert.equal(hasPlanFeature(DEFAULT_PLAN, "ai_assistant"), false);
  assert.equal(hasPlanFeature({ id: 3, name: "Enterprise", features: { payroll: false } }, "payroll"), false);
  assert.equal(hasPlanFeature({ id: 2, name: "Professional", features: { ai_assistant: true } }, "ai_assistant"), true);
  assert.equal(hasPlanFeature({ id: 2, name: "Professional", features: { ar_collections: true } }, "ar_collections"), true);
  assert.equal(hasPlanFeature({ id: 3, name: "Enterprise" }, "location_tracking"), false);
});
