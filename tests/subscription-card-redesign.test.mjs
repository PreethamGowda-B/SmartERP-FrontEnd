import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Subscription card redesign matches required visual structure and elements", () => {
  const componentSrc = fs.readFileSync(path.join(__dirname, "../components/subscription-status.tsx"), "utf8");

  // 1. Left section: ShieldCheck icon, Organization Tier, Plan name, Status badge
  assert.match(componentSrc, /ShieldCheck/, "Must render refined ShieldCheck icon");
  assert.match(componentSrc, /Organization Tier/, "Must display Organization Tier label");
  assert.match(componentSrc, /planMessage/, "Must render dynamic plan name");
  assert.match(componentSrc, /statusBadge/, "Must render status badge");

  // 2. Middle section: Expiration date with Calendar icon and remaining days
  assert.match(componentSrc, /Calendar/, "Must render Calendar icon for expiry section");
  assert.match(componentSrc, /Expires On/, "Must display Expires On label");
  assert.match(componentSrc, /Clock/, "Must display Clock icon for remaining days");
  assert.match(componentSrc, /days remaining/, "Must display days remaining label");

  // 3. Quota section: Crew and SKU pills
  assert.match(componentSrc, /Users/, "Must render Users icon for Crew usage");
  assert.match(componentSrc, /Crew/, "Must display Crew label");
  assert.match(componentSrc, /Package/, "Must render Package/Box icon for SKU usage");
  assert.match(componentSrc, /SKUs/, "Must display SKUs label");

  // 4. Right section: Manage Subscription button with Settings icon and route
  assert.match(componentSrc, /Manage Subscription/, "Must render Manage Subscription CTA");
  assert.match(componentSrc, /Settings/, "Must render Settings icon on button");
  assert.match(componentSrc, /\/owner\/settings\?tab=billing/, "Must link to billing tab");

  // 5. Subtle green accent
  assert.match(componentSrc, /bg-gradient-to-tr from-emerald-500/, "Must include subtle green gradient accent");
});
