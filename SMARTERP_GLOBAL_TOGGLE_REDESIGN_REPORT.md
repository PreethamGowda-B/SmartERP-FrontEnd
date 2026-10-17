# SmartERP Global Toggle Redesign Report

**Date:** 2026-10-17
**Scope:** Frontend toggle switches only. No backend, API, data, environment, or business-setting behavior was changed. No commit, push, or deployment was performed.

## Audit summary

The frontend had one shared Radix switch used across Owner, Employee, HR, invoice, and job forms, plus a separate theme switch that duplicated the Radix implementation. The shared switch used `translate-x-[calc(100%-2px)]`; because that percentage is relative to the thumb width, it translated the thumb only about 14px instead of the approximately 26px needed on the 44px track. The standalone theme switch used a hard-coded 26px translation, which happened to match its current 54px/20px/4px dimensions but was independent of the shared component and could drift if its dimensions changed.

The shared component now derives movement from each supported track width, thumb diameter, and inset. OFF and ON positions leave equal calculated insets at both ends. All existing Radix state, callback, disabled, and keyboard semantics remain in place. The theme control now uses the shared component and its theme size variant.

## Toggle inventory

| Portal / shared surface | Existing screen or component | Switch behavior |
|---|---|---|
| Owner | `app/owner/settings/page.tsx` | Notification preference switches and business setting switches (auto approval, overtime alerts, budget threshold alerts) |
| Owner | `app/owner/employees/page.tsx` | Employee account active state in list and edit form |
| Owner | `app/owner/attendance/page.tsx` | Automatic clock-out and early-departure half-day policy settings; these were native boolean checkboxes and now use the shared switch |
| Owner | `app/owner/remote-support/page.tsx` | Remote support resolution state |
| Owner | `app/owner/jobs/[id]/invoice-editor/page.tsx` | Inter-state tax and manual adjustment controls |
| Owner / Employee job creation | `components/job-form.tsx` | Job visibility to all employees |
| Owner invoice creation | `components/direct-invoice-modal.tsx` | Inter-state tax control |
| Employee | `app/employee/settings/page.tsx` | Notification preference switches |
| HR | `app/hr/settings/page.tsx` | Email and push notification preferences |
| Shared theme controls | `components/theme-switch.tsx`, used through `components/theme-toggle.tsx` in Owner, Employee, HR sidebars and Customer navigation | Light/dark theme switch; now wraps the shared switch with theme dimensions and L/D marks |

The audit found no standalone switch controls in Super Admin or Customer business settings. Customer navigation uses the shared theme switch. `app/hr/employees/page.tsx` imports `Switch` but does not render one; the unused import was not changed. Other native checkboxes in `components/material-purchase-review-dialog.tsx` are acknowledgement and physical-receipt confirmations, not on/off settings, so they remain checkboxes. Data-table checkboxes are row/column selection controls. No separate CSS pseudo-element switch implementation was found.

There are 16 direct `<Switch>` call sites in application screens/components, including some controls rendered repeatedly from preference arrays, plus the shared theme wrapper. Repeated runtime switch counts depend on the user’s notification preferences and data.

## Shared design and positioning

Updated `components/ui/switch.tsx` is the single SmartERP switch implementation. It retains Radix `Switch.Root` and `Switch.Thumb`, `checked`/`onCheckedChange`, built-in keyboard interaction, and disabled semantics. The component provides default, compact, and theme dimensions, a restrained slate OFF track, blue brand ON track, white circular thumb, hover/focus/disabled states, dark-mode colors, and reduced-motion support.

Thumb travel is calculated as:

`track width − (2 × track inset) − thumb diameter`

| Variant | Track | Thumb | Inset | ON travel | Calculated right inset |
|---|---:|---:|---:|---:|---:|
| Default | 44px | 16px | 3px | 22px | 3px |
| Compact | 36px | 14px | 3px | 16px | 3px |
| Theme | 54px | 20px | 4px | 26px | 4px |

These values are passed as CSS custom properties by the component, so the checked-state translation follows the matching size variant rather than relying on thumb-relative percentage movement or a page-specific transform. Existing account-row scaling remains intact and scales the track and travel together.

## Files changed

- `components/ui/switch.tsx` — centralized design, size metrics, and endpoint travel calculation.
- `components/theme-switch.tsx` — replaced duplicated Radix markup and inline styling with the shared switch wrapper.
- `components/theme-toggle.tsx` — removed theme-specific track color overrides so the shared ON/OFF states remain consistent.
- `app/owner/attendance/page.tsx` — migrated two boolean policy controls from native checkboxes to the shared switch, preserving their checked values and state updates.

No other toggle consumers needed code edits because they already use `components/ui/switch.tsx`; they receive the corrected design globally.

## Verification performed

- `npx tsc --noEmit` — **PASS**, exit code 0 after the final switch changes.
- `npx next lint` — **PASS**, exit code 0. It reported existing warnings in unrelated pages/components; no new toggle-related lint error was reported.
- `git diff --check` on the four changed files — **PASS**, no whitespace errors. Git emitted line-ending normalization warnings for edited files.
- Static occurrence search across `app`, `components`, `contexts`, and `lib` — shared switch call sites and remaining native checkboxes inventoried; no remaining independent Radix switch root, role-switch implementation, or old percentage-translation rule found.
- Geometry calculation check — **PASS** for all three variants; computed left and right insets are equal.
- A local Next.js development server started successfully and was stopped after the browser check attempt.

## Visual and interaction coverage

**Visual verification:** Not performed. The computer/browser tool reported that local browser use is disabled in Work settings and returned no available browsers, so the switch could not be inspected in a rendered page.

**Static-only behavior evidence:** Radix switch remains the underlying interactive primitive, and TypeScript passes. The existing controlled `checked`/`onCheckedChange` call sites remain unchanged except for the two attendance checkboxes, where `event.target.checked` was replaced by the equivalent boolean callback value.

Rapid clicking, actual keyboard interaction, disabled-state rendering, persisted settings after refresh, and mobile/tablet/desktop clipping were not exercised in a browser. No claim of visual or end-to-end verification is made.

## Remaining checks

When local browser access is available, verify at least one default switch, the scaled employee-row switch, and the theme variant in light and dark modes. Test OFF→ON→OFF, rapid repeated clicks, Space/Tab keyboard behavior, disabled state, and narrow viewport clipping. For persisted Owner/Employee/HR preferences, refresh after saving and confirm the value remains correct. No unresolved source-level alignment issue was found in the audited switch implementations.
