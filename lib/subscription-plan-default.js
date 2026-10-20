const STARTER_FEATURES = Object.freeze({
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
});

const DEFAULT_PLAN = Object.freeze({
  id: 1,
  plan_key: "starter",
  name: "Starter",
  is_trial: false,
  days_remaining: 0,
  employee_limit: 10,
  max_inventory_items: 50,
  max_active_jobs: 15,
  max_storage_bytes: 250 * 1024 * 1024,
  features: STARTER_FEATURES,
});

function hasPlanFeature(plan, featureKey) {
  return plan?.features?.[featureKey] === true;
}

module.exports = { DEFAULT_PLAN, STARTER_FEATURES, hasPlanFeature };
