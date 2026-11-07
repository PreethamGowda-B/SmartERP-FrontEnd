import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_ROOT = path.resolve(process.cwd());

test("Employee production workspace satisfies mobile responsiveness rules", () => {
  const filePath = path.join(FRONTEND_ROOT, "app", "employee", "production", "page.tsx");
  const source = fs.readFileSync(filePath, "utf-8");

  // Verify responsive header and title
  assert.ok(source.includes("flex-wrap items-center gap-2"), "Header badges wrap cleanly on small screens");
  assert.ok(source.includes("text-xl sm:text-2xl lg:text-3xl"), "Header text scales gracefully for mobile");

  // Verify responsive KPI metric cards
  assert.ok(source.includes("grid-cols-2 lg:grid-cols-4"), "Metrics grid is 2-col on mobile and 4-col on desktop");
  assert.ok(source.includes("p-3 sm:p-5"), "Metrics content padding adapts for compact screens");

  // Verify tab switcher handles horizontal scrolling without clipping or text wrapping
  assert.ok(source.includes("overflow-x-auto no-scrollbar"), "Tab switcher supports smooth horizontal scrolling");
  assert.ok(source.includes("shrink-0 whitespace-nowrap"), "Tab buttons do not break or squish text on mobile");

  // Verify 4-cell metadata grid prevents container blowout
  assert.ok(source.includes("min-w-0"), "Metadata cells include min-w-0 to allow proper truncation");

  // Verify touch-friendly action buttons
  assert.ok(source.includes("w-full sm:w-auto"), "Action buttons expand to full width on mobile for easy tapping");

  // Verify modal dialog responsive boundary
  assert.ok(source.includes("w-[calc(100vw-1.5rem)]"), "Dispatch dialog does not overflow mobile viewport");
});

test("Subscription card satisfies mobile responsiveness rules", () => {
  const filePath = path.join(FRONTEND_ROOT, "components", "subscription-status.tsx");
  const source = fs.readFileSync(filePath, "utf-8");

  // Verify Crew and SKU pills adapt for mobile
  assert.ok(source.includes("grid grid-cols-2 sm:flex sm:flex-row lg:flex-col"), "Usage pills layout cleanly on mobile");
  assert.ok(source.includes("min-w-0 sm:min-w-[130px]"), "Usage pills prevent horizontal overflow on narrow screens");
  assert.ok(source.includes("w-full sm:w-auto"), "Manage subscription button supports mobile full width");
});
