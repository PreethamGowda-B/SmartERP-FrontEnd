# SmartERP Customer Portal Audit Report

**Audit scope:** static source review of the Customer Portal frontend and its mounted customer API routes. No production API, customer account, or production data was used. Runtime, responsive-browser, and end-to-end behavior remain unverified.

## Architecture and request flow

- The portal is implemented under `app/customer/`. `app/customer/layout.tsx` mounts `CustomerAuthProvider` and `CustomerNotificationProvider`; individual authenticated pages render `CustomerNavbar` themselves. `/customer` redirects to `/customer/landing`.
- `contexts/CustomerAuthContext.tsx` obtains a CSRF token, checks `/api/customer/profile`, exposes login/logout/profile refresh, and drives the protected pages' redirect and loading states. `lib/customerApi.ts` is a separate Axios client with credentials, CSRF headers, a 10-second timeout, one 401 refresh attempt, and no-cache headers for GET requests. Its optional bearer-token fallback is stored in browser local/session storage; this is existing behavior and must not be weakened or expanded during a visual redesign.
- The backend mounts the customer router under `/api/customer` and `/api/v1/customer`. `routes/customer/index.js` applies `authenticateCustomer` to jobs, messages, reviews, profile, recurring, notifications, machines, and documents. The job detail/tracking handlers check customer, company, and job ownership before returning customer-visible information. The SSE handler separately validates its token and checks ownership/assignment before opening a stream.
- `CustomerNotificationProvider` loads the customer-scoped notification list and unread count, refreshes on customer job events, and polls every 30 seconds as recovery. Job chat uses customer-scoped message endpoints, uploads approved image/PDF types, and publishes Redis events when available. These are the existing real-time contracts; they are not equivalent to a guaranteed instant delivery SLA.
- `components/customer/jobs/TrackingMap.tsx` consumes authorized tracking data. The server only returns an assigned employee's location after acceptance/arrival and may return no coordinates. The redesign must show unavailable/stale states instead of implying that every job has a live map location.

## Route and workflow inventory

| Frontend route | Current purpose and existing integration |
| --- | --- |
| `/customer` | Client-side redirect to `/customer/landing`. |
| `/customer/landing` | Public marketing page. Currently uses hard-coded mock dashboard counts and jobs, including “Fix leaking pipe in bathroom.” |
| `/customer/login` | Customer email/password login through the auth context; Google OAuth link; forgot-password modal; OAuth and signup-result feedback. |
| `/customer/signup` | Name, email, password, phone, company-code validation, then OTP request; stores pending form details in session storage for verification. |
| `/customer/verify-otp` | OTP verification and signup completion, with resend support. |
| `/customer/onboarding` | Existing customer/company onboarding form posts to `/api/customer/auth/onboarding`. |
| `/customer/onboarding-wizard` | Fleet/machine registration using `/api/customer/machines`; overlaps with the machine-registration form in `/customer/machines`. |
| `/customer/dashboard` | Loads customer jobs and derives dashboard summaries, active work, activity, and shortcuts from the returned data. |
| `/customer/jobs` | Customer request list with server pagination/filtering and links to job details. |
| `/customer/create-job` | General or machine-based service request; loads customer machines and posts title, description, priority, schedule, machine, alarm code, and service type to `/api/customer/jobs`. Success is shown after the POST resolves. No attachment step is present in this form. |
| `/customer/job/[id]` | Loads owned job, tracking, materials, messages, review, and invoice data. Supports customer chat/file upload, invoice view/dispute, and completed-job review. SSE drives refreshes with polling/recovery behavior in the existing page. |
| `/customer/history` | Historical jobs with status/date filters and pagination. |
| `/customer/notifications` | Customer-scoped notifications, read state, refresh, and navigation to related jobs. |
| `/customer/documents` | Lists documents from `/api/customer/documents`. The document link currently falls back to `#` if a record has no file URL. |
| `/customer/invoices/[id]` | Fetches customer-visible invoice data through the customer jobs invoice endpoint; supports view/download tracking and dispute submission. |
| `/customer/machines` | Lists/registers customer machines through `/api/customer/machines`. |
| `/customer/machines/[id]` | Loads a customer machine and service timeline. |
| `/customer/recurring` | Lists, creates, runs, and cancels recurring jobs through `/api/customer/recurring`. |
| `/customer/profile` | Loads and updates the customer name/phone; backend also exposes deletion request/confirmation endpoints, which are not represented as a full account-settings workflow in this screen. |

Forgot/reset-password is embedded in the login experience and uses customer auth endpoints; no separate recovery route exists. No separate customer settings route exists. Backend route review also found customer auth endpoints for CSRF, OTP signup, login, refresh/logout, onboarding, company validation, and password recovery.

## Confirmed issues and risks

### Content and trust

- The public landing page describes generic service work and includes a bathroom pipe repair, static dashboard totals, fixed progress values, and a fabricated “Job Completed · 2 minutes ago” card. These are mock data and do not match the portal's verified CNC/fleet/service-request capabilities.
- Copy promises exact live technician location, instant notifications, a free account, and quick technician assignment. Source shows location is conditional on assignment and employee state, notification refresh includes polling, and registration requires a valid company code. Rewrite claims to match these contracts and avoid inventing business prices, testimonials, service categories, or company contact details.
- No verified configurable service catalog or public pricing feed was found in the reviewed customer routes. The landing page should explain the real request/tracking workflow and use clearly identified capability illustrations rather than presenting fabricated services or metrics.

### Design consistency and responsive concerns

- Customer screens mix Tailwind design tokens with page-specific hard-coded gray/blue/green/amber palettes and inconsistent card, heading, spacing, and form styles. The landing/login/signup flows use a separate visual treatment from authenticated screens.
- The desktop navbar attempts to show up to eight links at XL widths while also reserving profile, theme, and notification controls. It needs verification at narrow desktop/tablet breakpoints; the mobile drawer exposes all routes in one long list.
- Service request creation, machine registration, recurring-job forms, profile, notifications, job detail/chat, invoice detail, and documents each use distinct interaction and empty/error-state patterns. This increases maintenance cost and makes responsive quality inconsistent.
- Fleet setup and machine registration are separate routes that both create machines. Preserve both existing URLs but make their purpose and navigation coherent; do not silently remove either flow.
- Job detail is the largest customer screen and combines tracking, timeline, chat, materials, invoice/dispute, sign-off, and review UI. Redesign it in sections while retaining the current endpoint and permission boundaries.

### API and authorization boundaries to preserve

- Customer data access must continue to use the customer API client and authenticated server routes. The public company-code validation endpoint is intentionally separate from authenticated customer data.
- Job creation is a real POST; error states must preserve input and must never display success after a rejected request. Duplicate-submit locking must remain.
- Customer job, chat, tracking, invoice, review, document, and machine reads must not be replaced with landing-page demo data. Tracking should reflect unavailable/stale coordinates; chat should reflect SSE/reconnect and send failures; notifications should only become read after the API succeeds.
- Invoice viewing/download/dispute and machine service-history endpoints exist. The visual redesign must not broaden access or alter invoice/customer ownership checks.
- Static review found request-time table creation/alteration in the customer chat route's compatibility helper. This audit does not change that backend behavior; any schema/migration cleanup is separate work.

## Implementation sequence

1. Correct the public landing content and remove fictitious metrics/service examples. Establish customer-only design tokens and a reusable page-shell/form/status/empty-state vocabulary without changing other portals.
2. Unify customer navigation and responsive behavior; retain all current destinations and account actions.
3. Redesign login, company-code registration/OTP, onboarding, and forgot/reset flows while retaining their existing endpoint order, validation, secure session handling, and messages.
4. Redesign dashboard, request list/history, and create-job form using only API-backed customer data and existing payload fields.
5. Redesign job details, timeline, map, chat, attachments, invoice access/dispute, and review. Preserve SSE plus fallback refresh behavior and the existing role/ownership checks.
6. Redesign documents, notifications, machines/fleet setup, recurring jobs, and profile; reconcile duplicated machine-entry presentation without deleting routes or business capabilities.
7. Run static checks, route/API contract review, and responsive/browser tests when an authenticated browser/test environment is available. Record runtime tests separately from source inspection.

## Verification status

- Route inventory and request contracts: **source inspected**; see the routes and integrations above.
- Authentication, tenant isolation, and API behavior: **static review only**; no credentials or endpoints were exercised.
- Layout at the requested viewport widths: **not visually tested** in a browser during this audit.
- Customer login, signup, job creation, SSE/chat, notification reads, invoices, and profile persistence: **not runtime tested**.
- No frontend customer UI, backend code, schema, or customer data was changed as part of this audit.

## Implementation recheck

The preceding sections record the source-only audit before UI work began. During implementation, the following additional presentation and contract details were confirmed:

- `routes/customer/machines.js` supplies registration defaults for machine health/status and a synthetic registration timeline row when no real timeline event exists. Customer screens now avoid presenting those defaults as measured machine telemetry or a real service event.
- The customer job-list API is paginated and the visible response is scoped to the requested page. The job-list search and filters therefore say and behave as current-page filters; history uses the existing pagination response for older records.
- Customer document rows may exist without a downloadable `file_url`; the documents screen now identifies that state instead of rendering a dead `#` link.
- The customer invoice lookup accepts the existing job/invoice identifier flow, while invoice actions must use the resolved invoice ID. The invoice page now does so and no longer displays an online-payment button because the reviewed customer UI/API flow does not provide a working payment action.
- Job tracking remains conditional on assignment and available location data. The job-detail screen now says “Technician location,” shows the latest provided timestamp when present, and does not claim a fixed update interval or technician-online presence.
- Recurring-job datetime inputs use browser-local `datetime-local` values for constraints and convert submitted values to ISO timestamps only at the API boundary. An API response that does not confirm creation is shown as an error rather than a silent no-op.

These are implementation-time source findings, not production or authenticated-runtime verification. No backend route, schema, policy, customer record, or API contract was changed.
