# SmartERP Frontend (Prozync)

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat)]()

Production-grade, responsive Next.js 14 web application powering **SmartERP** (commercially branded as **Prozync**). SmartERP delivers unified, cloud-native Enterprise Resource Planning across five dedicated role portals: **Company Owner / Executive**, **Human Resources (HR)**, **Field & Factory Employees**, **B2B Customers**, and **Platform Super Admin**.

---

## Table of Contents

1. [Product Overview & Purpose](#1-product-overview--purpose)
2. [Architecture Overview](#2-architecture-overview)
3. [Verified Technology Stack](#3-verified-technology-stack)
4. [Role-Specific Portals & Navigation](#4-role-specific-portals--navigation)
5. [Feature Inventory by Portal](#5-feature-inventory-by-portal)
6. [Authentication & Frontend Security Model](#6-authentication--frontend-security-model)
7. [Frontend-to-Backend API Integration](#7-frontend-to-backend-api-integration)
8. [Responsive Design & Accessibility](#8-responsive-design--accessibility)
9. [Error Handling, Offline & Loading States](#9-error-handling-offline--loading-states)
10. [PWA, Web Manifest & Caching](#10-pwa-web-manifest--caching)
11. [Project Directory Structure](#11-project-directory-structure)
12. [Environment Configuration](#12-environment-configuration)
13. [Local Development Setup](#13-local-development-setup)
14. [Available Scripts & Test Commands](#14-available-scripts--test-commands)
15. [Production Build & Deployment](#15-production-build--deployment)
16. [Troubleshooting Guide](#16-troubleshooting-guide)
17. [Known Limitations & Roadmap](#17-known-limitations--roadmap)
18. [Contributing Standards](#18-contributing-standards)
19. [License & Attribution](#19-license--attribution)

---

## 1. Product Overview & Purpose

SmartERP is designed for precision engineering, CNC manufacturing, fabrication, and field service businesses. Rather than operating fragmented spreadsheets, isolated punch clocks, and standalone invoicing tools, SmartERP provides a unified system of record:

- **Operational Execution:** Job tracking from quotation and customer approval to CNC machine assignment, quality inspection, and dispatch.
- **Financial Compliance:** Automated GST invoicing (CGST, SGST, IGST), HSN/SAC summaries, accounts receivable (AR) aging, and payment reconciliation via Razorpay.
- **Workforce & Payroll:** GPS-geofenced and biometric clock-in/out, automated shift hours calculation, late/half-day resolution, and payroll pre-run audit engines.
- **B2B Collaboration:** Customer self-service portal for machine maintenance requests, real-time job progress tracking, and invoice payments.
- **Enterprise Governance:** Multi-tenant isolation with company scoping and Super Admin platform management.

---

## 2. Architecture Overview

SmartERP Frontend is constructed using the **Next.js 14 App Router** paradigm with strict client-server separation:

```
+-----------------------------------------------------------------------------------+
|                                 Next.js 14 Edge / Node                             |
|                                                                                   |
|  [ Middleware (middleware.ts) ] ---> Route Guards (Owner, Employee, HR, Customer, |
|                                                    Superadmin, Maintenance)       |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                Client Shell & Contexts                            |
|                                                                                   |
|  +------------------------+  +-----------------------+  +----------------------+  |
|  |   AuthContext.tsx      |  |   JobContext.tsx      |  |  GatekeeperContext   |  |
|  | (JWT, User Session,    |  | (Optimistic sync wait,|  | (Attendance lock     |  |
|  |  Namespace Isolation) |  |  Workflow status)     |  |  enforcement)        |  |
|  +------------------------+  +-----------------------+  +----------------------+  |
|  +------------------------+  +-----------------------+                            |
|  | NotificationContext    |  | Enterprise Chat       |                            |
|  | (SSE stream dedupe)    |  | (WebSocket / SSE)     |                            |
|  +------------------------+  +-----------------------+                            |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           Shared API Client (lib/apiClient.ts)                    |
|                                                                                   |
|  - Token Refresh Lock (Web Locks API / Cross-tab serialization)                   |
|  - Idempotency Header Injection (`Idempotency-Key: op-<uuid>`)                   |
|  - Network Fault Distinction (Offline vs HTTP 503 vs Unauthorized 401)            |
+-----------------------------------------------------------------------------------+
                                          | (HTTPS / WSS)
                                          v
+-----------------------------------------------------------------------------------+
|                     SmartERP Backend REST API (api.prozync.in)                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Verified Technology Stack

| Layer | Technology | Version | Purpose in SmartERP |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `14.2.35` | Server-rendered and client-hydrated application framework |
| **Runtime Core** | React / React DOM | `18.3.1` | Component UI library |
| **Language** | TypeScript | `^5.x` | Static typing across components, models, and API contracts |
| **Styling** | Tailwind CSS | `v4.1.16` | Modern CSS engine with `@tailwindcss/postcss` |
| **Component Primitives** | Radix UI | Latest | Accessible Dialog, Accordion, Dropdown, Tabs, Popover |
| **Icons** | Lucide React | `^0.454.0` | Comprehensive enterprise iconography |
| **Form Management** | React Hook Form + Zod | `7.65.0` / `3.25.0` | High-performance form validation and schema parsing |
| **Data Charts** | Recharts | `^3.3.0` | Financial dashboards, attendance metrics, inventory trends |
| **Interactive Maps** | Leaflet + React-Leaflet | `1.9.4` / `5.0.0` | GPS location verification for employee mobile clock-in |
| **Notifications** | Sonner | `^2.0.7` | Unintrusive, accessible toast notifications |
| **Document Export** | jsPDF / xlsx | `2.5.2` / `0.18.5` | In-browser PDF invoice rendering and Excel report export |
| **Error Telemetry** | Sentry (`@sentry/nextjs`)| `^10.44.0` | Client and edge runtime exception tracking |

---

## 4. Role-Specific Portals & Navigation

SmartERP enforces role-scoped portals across **147 distinct pages** (compiling into 130 static pre-rendered HTML shells plus dynamic server-rendered routes) at both the Next.js `middleware.ts` level and within client-side route layouts:

```
/
├── (public & auth)                # 11 pages (/, /pricing, /terms, /privacy, /suspended, /auth/*)
├── /owner/*                       # Company Owner / Executive portal (51 pages)
├── /hr/*                          # Human Resources portal (21 pages)
├── /customer/*                    # B2B Client Portal (20 pages)
├── /employee/*                    # Field & Factory staff portal (18 pages)
├── /superadmin/*                  # Master Platform Administration (13 pages)
└── /[adminRoute]/*                # Backwards-compatible legacy admin slug aliases (13 pages)
```

---

## 5. Feature Inventory by Portal

### 5.1 Company Owner Portal (`/owner/*`)
- **Executive Command Center (`/owner`):** Real-time revenue run rate, active job throughput, employee presence ratio, and urgent approval counters.
- **Direct / Walk-In Invoicing (`/owner/finance/invoices`):** Responsive modal invoice generator supporting line items, HSN/SAC codes, CGST/SGST/IGST tax splits, discount tiers, and instant payment recording.
- **CNC Manufacturing & Dispatch (`/owner/production`):** Quality inspection release, packing workflow, undispatched balance reconciliation, and dispatch ledger.
- **AR Aging & Collections (`/owner/ar-collections`):** 30/60/90+ day debtor aging buckets with automated collection reminder triggers.
- **Attendance & Shift Gatekeeper (`/owner/attendance`):** Biometric and GPS attendance audits with manual adjustment request approval.
- **Payroll Pre-Run Engine (`/owner/payroll`):** One-click salary calculations reconciling increments, overtime, and deductions against verified attendance hours.
- **AI Business Copilot:** RAG-assisted assistant answering operational queries with company-scoped citations.

### 5.2 Employee Portal (`/employee/*`)
- **Mobile Clock-In/Out (`/employee/time-tracking`):** Geofenced GPS location verification preventing off-site punch fraud.
- **Assigned Work Queue (`/employee/jobs`):** View active job instructions, update progress status (`pending` $\to$ `in_progress` $\to$ `completed`), and record material usage.
- **Shift & Attendance History (`/employee/attendance`):** Transparent view of logged hours, late deductions, and overtime credits.
- **Internal Messaging (`/employee/messages`):** Real-time messaging with dispatchers and supervisors.

### 5.3 Human Resources Portal (`/hr/*`)
- **HR Hub (`/hr/attendance`):** Daily attendance reconciliation dashboard with late-arrival and half-day tags.
- **Employee Directory (`/hr/employees`):** Onboarding records, salary profiles, assigned department, and emergency contacts.
- **Leave & Correction Requests:** Review and approve clock-in correction requests with immutable audit logging.

### 5.4 B2B Customer Portal (`/customer/*`)
- **Service & Job Tracking (`/customer/jobs`):** End-to-end visibility into job stages without calling account managers.
- **Machine Registry (`/customer/machines`):** Track industrial equipment serial numbers, maintenance history, and warranty statuses.
- **Invoice & Online Payments (`/customer/invoices`):** Download official tax invoices and complete payments via integrated Razorpay gateway.

### 5.5 Super Admin Portal (`/superadmin/*`)
- **Tenant Management (`/superadmin/companies`):** Tenant provisioning, plan override, and company suspension controls.
- **Platform Health & Metrics (`/superadmin/system-health`):** Real-time API latency, Redis queue status, and database connection pool metrics.
- **Broadcast Announcements (`/superadmin/announcements`):** System-wide maintenance notices and banner broadcasts.

---

## 6. Authentication & Frontend Security Model

SmartERP Frontend enforces enterprise client security:

1. **JWT Lifecycle & Cross-Tab Locking:**
   - Access tokens are stored in secure memory / authenticated session storage.
   - When an access token expires, token renewal is serialized across browser tabs using the **Web Locks API** (`navigator.locks.request`), preventing stampedes of redundant refresh requests.
2. **Session Namespace Isolation:**
   - Prevents delayed or background 401 responses from one namespace (e.g., an AI widget or Super Admin query) from accidentally invalidating an active Owner session.
3. **Honest Contracts (Zero Optimistic Fabrication):**
   - The UI never fakes financial states, unverified invoice numbers, or phantom export confirmations. Every mutation explicitly awaits server confirmation.
4. **Idempotency Header Protection:**
   - Financial mutations and invoice creations inject an `Idempotency-Key` header (`op-<uuid>`) derived from user intent, preventing accidental double-billing upon network timeout retries.

---

## 7. Frontend-to-Backend API Integration

The frontend integrates with the backend via a standardized, typed client located in [`lib/apiClient.ts`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/lib/apiClient.ts) supported by [`lib/api-environment.mjs`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/lib/api-environment.mjs) and [`lib/auth-session.mjs`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/lib/auth-session.mjs):

- **Base URL Discovery:**
  - Production: Uses explicit configured HTTPS origin (`NEXT_PUBLIC_API_URL=https://api.prozync.in`).
  - Development: Defaults to `http://localhost:5000` with strict checks against remote leakages.
- **Server-Sent Events (SSE):**
  - Connected to `/api/notifications/sse` with `withCredentials: true`.
  - Immune to URL token leakage and hardened against Cloudflare QUIC edge stream resets.

---

## 8. Responsive Design & Accessibility

The entire UI is built on a responsive, mobile-first grid adhering to WCAG 2.1 AA accessibility standards:
- **Desktop / Laptop (`>= 1024px`):** Expansive multi-column layouts; modals scale to `min(1100px, 94vw)` and `90vh` with internal scrolling.
- **Tablet (`768px - 1023px`):** Collapsible sidebars, adapted 2-column forms, touch-friendly tables.
- **Mobile (`320px - 767px`):** Single-column stacked flows, sticky action ribbons, swipeable bottom drawers via Vaul, minimum 44px tap targets.
- **High Contrast & Theme Support:** Integrated `next-themes` dark/light mode toggle with semantic color tokens.

---

## 9. Error Handling, Offline & Loading States

- **Network Fault Classification:** The client distinguishes true offline disconnection (`navigator.onLine === false`) from server 503 unavailability, avoiding misleading "no internet connection" messages during maintenance.
- **Skeleton Shimmers & Spinners:** Critical data views (Jobs, Invoices, Attendance) render accessible skeleton loaders while fetching.
- **Form Error Feedback:** Zod schemas feed field-level errors directly beneath inputs with red contrast highlights and screen-reader alerts.

---

## 10. PWA, Web Manifest & Caching

SmartERP is configured as a Progressive Web Application (PWA):
- **Manifest:** [`public/manifest.json`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/public/manifest.json) configures standalone display mode, theme colors, and responsive icon assets.
- **Offline Assets:** Core SVG icons and static styles are cached for rapid subsequent loads.

---

## 11. Project Directory Structure

```text
SmartERP-Frontend/
├── .github/                  # GitHub Actions CI workflows
├── app/                      # Next.js 14 App Router routes
│   ├── auth/                 # Login, Register, Password Recovery
│   ├── customer/             # B2B Customer Portal
│   ├── employee/             # Field & Factory Employee Portal
│   ├── hr/                   # Human Resources Hub
│   ├── owner/                # Company Owner / Executive Portal
│   ├── superadmin/           # Platform Administration Portal
│   ├── layout.tsx            # Root HTML layout with providers
│   ├── page.tsx              # Public SaaS landing page
│   ├── pricing/              # Subscription plan catalog
│   └── suspended/            # Tenant suspension holding screen
├── components/               # Reusable UI component library
│   ├── ui/                   # Radix UI primitives styled with Tailwind
│   ├── direct-invoice-modal.tsx  # Responsive Walk-in Invoice Generator
│   ├── smart-clock-in-out.tsx    # GPS-geofenced time tracking widget
│   └── enterprise-chat-window.tsx# Real-time messaging interface
├── contexts/                 # React Context providers (Auth, Job, Notification)
├── docs/                     # Documentation & Architectural Records
│   ├── archive/              # Historical redesign & implementation reports
│   └── operations/           # CORS setup and operational runbooks
├── hooks/                    # Custom React hooks (useAuth, useDebounce, etc.)
├── lib/                      # Core utilities (apiClient.ts, utils.ts, date helpers)
├── public/                   # Static assets (images, icons, manifest.json)
├── tests/                    # Automated unit & contract tests (Node.js test runner)
├── .editorconfig             # Standardized cross-editor code formatting
├── .env.example              # Environment variable documentation template
├── CONTRIBUTING.md           # Developer workflow and contribution guidelines
├── next.config.mjs           # Next.js bundler and security header configuration
├── package.json              # Project dependencies and script commands
├── SECURITY.md               # Security policy and vulnerability disclosure SLA
└── tsconfig.json             # TypeScript compiler configuration
```

---

## 12. Environment Configuration

Create a `.env.local` file in the repository root based on `.env.example`:

```bash
# Backend REST API Origin (No trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Application Environment ('development', 'staging', 'production')
NEXT_PUBLIC_APP_ENV=development

# Optional: Google OAuth Client ID for single sign-on
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Optional: Sentry DSN for error telemetry
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

> [!WARNING]
> Never prefix database credentials, service-role tokens, or private secrets with `NEXT_PUBLIC_`. All `NEXT_PUBLIC_` variables are bundled directly into client JavaScript.

---

## 13. Local Development Setup

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS)
- **npm**: `v10+`

### Step-by-Step
```bash
# 1. Clone repository
git clone https://github.com/PreethamGowda-B/SmartERP-Frontend.git
cd SmartERP-Frontend

# 2. Install dependencies
npm install

# 3. Create local configuration
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 14. Available Scripts & Test Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with Fast Refresh |
| `npm run build` | Compiles production bundle and generates 130+ static and dynamic routes |
| `npm start` | Starts Next.js production server from `.next` build output |
| `npm test` | Runs all 73+ unit, security, and responsive UI contract tests |
| `npm run typecheck` | Runs `tsc --noEmit` to verify 100% TypeScript type safety |
| `npm run lint` | Runs ESLint to verify Next.js coding standards |

---

## 15. Production Build & Deployment

SmartERP Frontend is optimized for deployment on **Vercel** or containerized via Docker:

```bash
# Compile and verify production build locally
npm run build
```

**Build Guarantees:**
- 100% type-checked with TypeScript.
- Pre-rendered static shells (`○`) for marketing, terms, and login screens.
- Server-rendered dynamic pages (`ƒ`) for authenticated portals with zero leaked server data.

---

## 16. Troubleshooting Guide

- **API requests fail with CORS errors:**
  - Verify `NEXT_PUBLIC_API_URL` exactly matches the backend host without a trailing slash.
  - In backend configuration, ensure `FRONTEND_URL` includes `http://localhost:3000` (development) or `https://prozync.in` (production).
- **Session repeatedly expires or loops:**
  - Clear stale browser cookies and localStorage keys (`smarterp_session`).
  - Consult [`docs/operations/REDIRECT_LOOP_FIX.md`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/docs/operations/REDIRECT_LOOP_FIX.md).
- **Icons or fonts fail to load:**
  - Verify that `public/` assets are present and SVG files are not blocked by strict ad-blocker rules.

---

## 17. Known Limitations & Roadmap

- **Multi-Currency Invoicing:** Currently optimized for Indian Rupee (`INR` / `₹`) with standard GST rules; multi-currency international invoicing is planned for future phases.
- **Offline Data Sync:** Basic offline status detection is active; full offline data mutation queuing via IndexedDB is on the roadmap.
- **Native Mobile Apps:** Mobile web PWA is fully responsive; native iOS/Android wrappers are planned via React Native / Capacitor.

---

## 18. Contributing Standards

Please review [`CONTRIBUTING.md`](file:///c:/Users/ADMIN/Desktop/SMARTERP/SmartERP-Frontend/CONTRIBUTING.md) for branch policies, commit conventions, and code review requirements before submitting pull requests.

---

## 19. License & Attribution

Copyright &copy; 2026 SmartERP Technologies (Prozync). All rights reserved.  
Unauthorized copying, reverse engineering, or redistribution of this software is strictly prohibited.
