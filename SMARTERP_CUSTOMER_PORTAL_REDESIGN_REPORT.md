# SmartERP Customer Portal Redesign Report

**Scope:** customer-only UI, content, and interaction improvements. Existing API endpoints, authentication behavior, customer/tenant authorization, backend rules, and data were preserved. No production API, database, or customer account was used.

## Initial audit

The pre-change findings are recorded in [SMARTERP_CUSTOMER_PORTAL_AUDIT_REPORT.md](./SMARTERP_CUSTOMER_PORTAL_AUDIT_REPORT.md). The portal already had real customer workflows, including job requests, job tracking, employee chat, invoices, documents, customer machines, recurring jobs, notifications, and profile editing. The initial audit found demo content on the public landing page, claims that exceeded location/notification guarantees, inconsistent presentation between public/authenticated routes, and several UI states that implied actions or data were available when they were not.

The implementation-time source recheck is appended to the audit file. It records the machine-default/timeline behavior, page-scoped job search, documents without file URLs, invoice identifier handling, conditional location data, and recurring-date response handling.

## Routes inspected

- `/customer` — root redirect.
- `/customer/landing` — public portal landing page.
- `/customer/login`, `/customer/signup`, `/customer/verify-otp` — login, company-code registration, OTP verification, Google OAuth link, and password recovery modal.
- `/customer/onboarding`, `/customer/onboarding-wizard` — customer onboarding and machine/fleet setup.
- `/customer/dashboard` — customer summaries, current work, completed work, and quick links.
- `/customer/jobs`, `/customer/create-job`, `/customer/job/[id]`, `/customer/history` — service request creation, listing, details/tracking/chat, and history.
- `/customer/notifications`, `/customer/documents`, `/customer/invoices/[id]` — notifications, customer-accessible records, and invoice detail/dispute/download UI.
- `/customer/machines`, `/customer/machines/[id]`, `/customer/recurring`, `/customer/profile` — machines and service timeline, recurring requests, and customer profile.
- Customer `error.tsx` and `not-found.tsx` states.

There is no distinct customer service-catalog route or account-settings route in the inspected frontend. The implementation preserves current routes and does not invent new backend-backed features.

## Design and implementation

- Added customer-scoped design tokens and dark-mode values in `app/customer/customer-portal.css`, including a shared neutral palette, responsive auth layout, and reduced-motion handling. Neutral utility colors are bridged to the same portal tokens to make existing customer pages more consistent without affecting other portals.
- Added `components/customer/auth/CustomerAuthShell.tsx` and reused it for login, signup, OTP verification, and onboarding screens.
- Rebuilt the customer navbar for compact desktop navigation and a mobile drawer while retaining current destinations, profile, notifications, theme, and logout controls.
- Rebuilt the public landing page around the actual service-request workflow. Removed the bathroom-service example, hardcoded dashboard metrics, fabricated job activity, and unverified guarantees/pricing/reviews.
- Reworked the dashboard to derive visible job metrics from the actual jobs response and explain that counts cover the latest loaded records. Removed unsupported machine, preventive-maintenance, and warranty metrics.
- Improved request list/history filtering and pagination clarity. Search/status/priority filters now accurately apply to loaded pages; history uses the existing server pagination for older records.
- Improved service-request form copy, local datetime constraints, service-type selection where supported, and error-preserving UX.
- Updated job detail status language so “connected” refers to the event stream, and location/chat copy does not imply an always-live location or employee-online presence. The existing SSE, polling recovery, tracking, chat, invoice, materials, and review API calls remain in place.
- Reworked documents and notification states so unavailable files are not rendered as dead links and read-state feedback follows successful API operations.
- Improved machine and fleet screens to avoid treating backend defaults as telemetry or a real service event. Removed unsupported health/AMC claims and fabricated machine defaults.
- Updated invoice detail actions to use the invoice ID resolved by the existing customer endpoint. Removed the nonfunctional online-payment button; no payment API was added.
- Updated profile save/load failures, error/empty/retry states, and the recurring-job form. Recurring datetime values are constrained in the browser’s local timezone and converted to ISO at submission; invalid server responses do not produce silent success.
- Added customer-specific error and not-found pages. Customer OTP input now exposes accessible labels and retains entered values if resend fails.

## Files changed for this work

- `SMARTERP_CUSTOMER_PORTAL_AUDIT_REPORT.md`
- `app/customer/customer-portal.css` (new)
- `app/customer/layout.tsx`
- `app/customer/landing/page.tsx`
- `app/customer/login/page.tsx`
- `app/customer/signup/page.tsx`
- `app/customer/verify-otp/page.tsx`
- `app/customer/onboarding/page.tsx`
- `app/customer/onboarding-wizard/page.tsx`
- `app/customer/dashboard/page.tsx`
- `app/customer/jobs/page.tsx`
- `app/customer/create-job/page.tsx`
- `app/customer/history/page.tsx`
- `app/customer/job/[id]/page.tsx`
- `app/customer/notifications/page.tsx`
- `app/customer/documents/page.tsx`
- `app/customer/invoices/[id]/page.tsx`
- `app/customer/machines/page.tsx`
- `app/customer/machines/[id]/page.tsx`
- `app/customer/recurring/page.tsx`
- `app/customer/profile/page.tsx`
- `app/customer/error.tsx` (new)
- `app/customer/not-found.tsx` (new)
- `components/customer/auth/CustomerAuthShell.tsx` (new)
- `components/customer/auth/OtpInput.tsx`
- `components/customer/layout/CustomerNavbar.tsx`

## API, security, and data behavior

No backend route, API payload, database schema, policy, or authorization logic was changed. Existing customer API calls continue through `lib/customerApi.ts`, including its credential/CSRF behavior and refresh handling. Customer data remains loaded from authenticated customer routes; no production mock records or hardcoded customer metrics were added. The public company-code check and existing OTP/onboarding sequence were retained. UI source review is not evidence that cross-customer or cross-company access was runtime-tested.

The removed payment button was not backed by an available working customer payment action in the inspected UI/API flow. Customers can still view the resolved invoice, use its existing download/track behavior, and submit the existing invoice issue/dispute request.

## Verification performed

- `npx tsc --noEmit` — passed after the final customer edits.
- `npx eslint app/customer components/customer` — passed with no errors or warnings after rendering authorized chat attachments with the unoptimized `next/image` component.
- `git diff --check` — passed. Git reported line-ending normalization warnings for modified files; no whitespace errors were reported.
- `npm run build` — passed. Next.js compiled and generated the app routes. The full-project build reported lint warnings in auth, employee, owner, and shared modules outside the customer portal; they were left out of this scoped change. The focused customer lint command was clean.
- No automated browser/E2E test command is defined in the frontend `package.json` scripts.

## Responsive and visual verification

The implementation includes small-screen breakpoints, stacked forms/content, a mobile navigation drawer, responsive cards, and reduced-motion CSS. The requested viewport widths (320–1440 px) were **not visually verified**. A local Next development server was started for inspection, but the available browser and shell could not connect to its localhost socket. No deployed/production portal was opened as a substitute. Therefore layout overflow, clipping, touch-target behavior, keyboard behavior, and actual theme appearance remain **not verified in a rendered browser**.

## Functional verification and limitations

- Frontend types, lint, and build are static compilation checks; they do not verify live login, OTP, OAuth, customer job creation, chat delivery, notifications, invoice downloads, document permissions, recurring operations, or profile persistence.
- No authenticated customer session or isolated customer test backend was available for end-to-end verification.
- Customer location is still conditional on assignment and an employee location update. The UI no longer describes missing data as live tracking.
- The backend can return document rows without file URLs, and machine registration can populate default status/health fields. UI labels were corrected; backend behavior was not changed.
- Search/filter controls on the paginated job list operate on the current page because the existing customer endpoint does not accept those filters.
- Company-specific business name, service catalog, pricing, testimonials, contact information, and availability claims require verified owner-provided content before they can be added.
- No backend changes were required for the presentation fixes. Runtime verification requires an isolated customer test environment and accounts with appropriate customer/employee/owner roles.

## Change-control status

The earlier AI-chat work was pushed before this portal work began (`ca97944`). The attached customer-portal brief says not to commit, push, or deploy these new customer-portal changes, so they remain local. Existing unrelated modifications in owner, HR, employee, inventory, and shared components were preserved and not included intentionally in this customer work. No production API/database was used; no environment files, migration, or production data were changed, and this redesign was not committed, pushed, or deployed.
