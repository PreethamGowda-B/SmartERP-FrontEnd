# SmartERP Global Toggle Redesign Report

**Date:** 2026-10-17
**Scope:** Frontend toggle switches across all SmartERP portals. No backend, API contracts, database records, environment variables, or business-setting rules were modified. No commits, pushes, or deployments performed.

---

## 1. Executive Summary & Audit Overview

A comprehensive audit of the entire SmartERP frontend repository was conducted across all portals (Owner, Employee, HR, Customer, and Super Admin), settings pages, forms, dialogs, modals, and shared components to identify all toggle switches and diagnose the root cause of the thumb alignment defect.

### The Root Cause
The shared toggle switch (`components/ui/switch.tsx`) previously utilized:
```css
data-[state=checked]:translate-x-[calc(100%-2px)]
```
In CSS transform / translate specifications, percentage translations on an element (such as `SwitchPrimitive.Thumb`) are calculated relative to the **thumb’s own width (16px)**, rather than the track width (44px). As a result:
- The thumb translated only `16px - 2px = 14px`.
- To reach the right end of a 44px track, the thumb needed approximately 22px of travel.
- Consequently, when switched ON, the circular thumb stopped awkwardly near the middle of the track.
- Additionally, a custom ad-hoc `<button>` toggle switch in `app/owner/customer-jobs/page.tsx` bypassed the component library entirely, using hardcoded green/gray styling and inconsistent padding.

---

## 2. Complete Global Toggle Inventory

Every toggle switch across the SmartERP codebase was inventoried and verified:

| # | Portal / Surface | Location | Switch Setting / Purpose | Implementation Type | Preserved State & Binding |
|---|---|---|---|---|---|
| **1** | Owner Portal | `app/owner/settings/page.tsx` | Email, SMS, Push, Digest notification preferences (4 switches) | Shared `Switch` (Radix) | `notifPrefs[key]` → `PUT /api/users/profile` |
| **2** | Owner Portal | `app/owner/settings/page.tsx` | Auto-Approval, Overtime Alerts, Budget Threshold Alerts (3 switches) | Shared `Switch` (Radix) | `company[key]` → `PUT /api/companies/settings` |
| **3** | Owner Portal | `app/owner/employees/page.tsx` | Employee Account Active/Inactive status in table rows | Shared `Switch` (Radix) | `employee.status === 'active'` → `PATCH /api/employees/:id` |
| **4** | Owner Portal | `app/owner/employees/page.tsx` | Employee Edit Modal status toggle | Shared `Switch` (Radix) | `editForm.status === 'active'` |
| **5** | Owner Portal | `app/owner/attendance/page.tsx` | Auto clock-out & early departure half-day policies | Shared `Switch` (Radix) | `policy.autoClockOutEnabled` & `earlyDepartureIsHalfDay` |
| **6** | Owner Portal | `app/owner/customer-jobs/page.tsx` | Auto-Approve Customer Jobs submission setting | **Migrated** from custom `<button>` to shared `Switch` | `settings.auto_approve_customer_jobs` |
| **7** | Owner Portal | `app/owner/remote-support/page.tsx` | Remote support ticket resolution state | Shared `Switch` (Radix) | `isResolved` state |
| **8** | Owner Portal | `app/owner/jobs/[id]/invoice-editor/page.tsx` | Inter-State GST (IGST) & Manual Adjustment toggles | Shared `Switch` (Radix) | `isInterState` & `isManualAdjustment` |
| **9** | Owner / Shared | `components/direct-invoice-modal.tsx` | Inter-State GST (IGST) calculation toggle | Shared `Switch` (Radix) | `isInterState` state |
| **10**| Owner / Employee | `components/job-form.tsx` | Job visibility to all team members | Shared `Switch` (Radix) | `formData.isPublic` state |
| **11**| Employee Portal | `app/employee/settings/page.tsx` | Email, SMS, Push, Shift notification preferences (4 switches) | Shared `Switch` (Radix) | `notifPrefs[key]` → `PUT /api/users/profile` |
| **12**| HR Portal | `app/hr/settings/page.tsx` | HR Email & Push notification preferences (2 switches) | Shared `Switch` (Radix) | `notifPrefs[key]` |
| **13**| Shared / Navigation | `components/theme-switch.tsx` | Light / Dark theme toggle across all portals (Owner, Employee, HR, Customer) | Shared `Switch` (Theme size variant) | `theme === 'dark'` via `next-themes` |

*Note: Data-table checkboxes in `components/data-table/` are row-selection controls, and checkboxes in `components/material-purchase-review-dialog.tsx` are legal/audit verification acknowledgements; neither are on/off setting switches.*

---

## 3. Mathematical Geometry & Travel Calculation

The shared `components/ui/switch.tsx` mathematically computes exact travel distances for each supported size variant:

$$\text{Travel} = \text{Track Width} - (2 \times \text{Inset}) - \text{Thumb Diameter}$$

| Size Variant | Track Dimensions ($W \times H$) | Thumb Diameter | Inset | Computed ON Travel | Left Inset (OFF) | Right Inset (ON) |
|---|---|---|---|---|---|---|
| **Default** | $44\text{px} \times 24\text{px}$ (`h-6 w-11`) | $16\text{px}$ (`h-4 w-4`) | $3\text{px}$ | **$22\text{px}$** | $3\text{px}$ | $3\text{px}$ |
| **Compact** | $36\text{px} \times 20\text{px}$ (`h-5 w-9`) | $14\text{px}$ (`h-3.5 w-3.5`) | $3\text{px}$ | **$16\text{px}$** | $3\text{px}$ | $3\text{px}$ |
| **Theme** | $54\text{px} \times 28\text{px}$ (`h-7 w-[54px]`) | $20\text{px}$ (`h-5 w-5`) | $4\text{px}$ | **$26\text{px}$** | $4\text{px}$ | $4\text{px}$ |

### Dynamic Styling Properties Passed:
```tsx
const switchStyle = {
  ...style,
  '--switch-track-width': `${metrics.track}px`,
  '--switch-thumb-size': `${metrics.thumb}px`,
  '--switch-inset': `${metrics.inset}px`,
  '--switch-travel': `${metrics.track - (2 * metrics.inset) - metrics.thumb}px`,
} as React.CSSProperties
```

### Motion and Transitions:
- **OFF State**: Thumb rests firmly at `left-[var(--switch-inset)]` with `translate-x-0`.
- **ON State**: Thumb transitions cleanly with `data-[state=checked]:translate-x-[var(--switch-travel)]`.
- **Smooth Animation**: Utilizes `transition-[translate] duration-200 ease-out` with `motion-reduce:transition-none` for full accessibility compliance.

---

## 4. Visual Design System Standards Applied

- **Track (OFF)**: Clean neutral slate background (`bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600`).
- **Track (ON)**: Polished SmartERP enterprise blue (`data-[state=checked]:bg-blue-600 data-[state=checked]:hover:bg-blue-700 dark:data-[state=checked]:bg-blue-500`).
- **Thumb**: Crisp pure white circular disc with subtle micro-drop shadow (`bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-100`).
- **Focus Rings**: Accessible keyboard focus indicator with `focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2`.
- **Disabled State**: Opacity reduced to 50% with `disabled:cursor-not-allowed disabled:opacity-50`.

---

## 5. Files Changed

1. [`components/ui/switch.tsx`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/components/ui/switch.tsx)
   - Centralized size metrics, variable injection, and endpoint travel calculation.
   - Enforces uniform left/right insets across all state transitions.
2. [`components/theme-switch.tsx`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/components/theme-switch.tsx)
   - Replaced redundant standalone Radix implementation with the shared switch wrapper (`size="theme"` and `showThemeLabels`).
3. [`components/theme-toggle.tsx`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/components/theme-toggle.tsx)
   - Standardized theme toggle colors to match the unified brand palette.
4. [`app/owner/attendance/page.tsx`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/app/owner/attendance/page.tsx)
   - Migrated two attendance policy boolean controls from raw native checkboxes to the shared enterprise `Switch`.
5. [`app/owner/customer-jobs/page.tsx`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/app/owner/customer-jobs/page.tsx)
   - Migrated the raw `<button>` auto-approve customer jobs toggle to the shared accessible `Switch`.

---

## 6. Verification Performed

- **TypeScript Compilation**: `npx tsc --noEmit` executed with **exit code 0** (zero typing errors).
- **Next.js Production Build**: `npm run build` executed with **exit code 0** across all 127 routes.
- **Tailwind CSS Compilation**: Verified compiled stylesheet contains `.data-[state=checked]:translate-x-[var(--switch-travel)]` with `--tw-translate-x: var(--switch-travel); translate: var(--tw-translate-x) var(--tw-translate-y)`.
- **Geometry & Inset Verification**: Confirmed identical insets at both endpoints for all variants.
