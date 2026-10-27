# Contributing to SmartERP Frontend

Thank you for your interest in contributing to SmartERP Frontend. This document outlines the standards, branch conventions, and testing requirements to ensure high software quality across our codebase.

---

## 1. Code of Conduct

All contributors are expected to uphold a professional, respectful, and collaborative environment. Treat team members, reviewers, and users with courtesy.

---

## 2. Branching & Git Workflow

- **`main`**: Production branch. Deployments to Vercel production are automatically triggered from `main`.
- **`launch-hardening`**: Current active stabilization and production-hardening branch.
- **Feature Branches**: Create focused feature branches branching from `launch-hardening` (or `main`):
  - `feat/<feature-name>` for new capabilities
  - `fix/<bug-description>` for bug repairs
  - `chore/<task-name>` for dependencies and maintenance
  - `docs/<doc-name>` for documentation updates

### Commit Guidelines
We follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```
Examples:
- `feat(owner): add responsive export modal for GST invoices`
- `fix(auth): prevent stale refresh token from invalidating active session`
- `test(ai): add unit test for citation verification`

---

## 3. Local Development Setup

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Backend API**: Running locally on `http://localhost:5000` or connected to staging (`https://api.prozync.in`)

### Installation & Run
```bash
# Clone repository
git clone https://github.com/PreethamGowda-B/SmartERP-Frontend.git
cd SmartERP-Frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your local configuration

# Start development server
npm run dev
```

---

## 4. Code Standards & Architecture Guidelines

1. **Next.js App Router Conventions:**
   - Place portal routes under their respective subdirectories: `app/owner/`, `app/employee/`, `app/hr/`, `app/customer/`, `app/superadmin/`.
   - Prefer React Server Components (RSC) where applicable; mark interactive client components with `'use client'`.
2. **Honest Frontend Contracts:**
   - Never fabricate optimistic states for operations that require database persistence (e.g., invoice generation, job status updates, attendance clock-in). Always wait for server confirmation.
   - Gracefully display empty, loading, and error states using shared design components.
3. **Responsive Design:**
   - All modal dialogs, data tables, and input forms must scale smoothly across Desktop (`>= 1280px`), Laptop (`1024px`), Tablet (`768px`), and Mobile (`320px–390px`).
   - Use Tailwind CSS utility classes and `tailwind-merge` (`cn()`) for styling.
4. **No Secrets in Client Bundles:**
   - Never prefix private secrets with `NEXT_PUBLIC_`.
   - Never hardcode API keys, passwords, or company credentials.

---

## 5. Verification & Testing

Before submitting a Pull Request, verify that all checks pass locally:

```bash
# 1. Run unit and integration tests
npm test

# 2. Run TypeScript type checks and linting
npx tsc --noEmit
npm run lint

# 3. Verify production build
npm run build
```

Every PR must maintain a clean build (`npm run build` exits 0) with zero TypeScript compiler errors.
