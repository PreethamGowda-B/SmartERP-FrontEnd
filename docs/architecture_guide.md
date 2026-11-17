# 📘 SmartERP Frontend Architecture & Developer Guide

Welcome to the **SmartERP** developer guide. This document provides technical instructions for extending the codebase, building new enterprise tables, registering command palette actions, and maintaining 100% type safety and performance standards.

---

## 1. Architecture Overview

SmartERP uses a **Layered Hybrid Architecture** combining Next.js 14 App Router with generic design primitives:

```
┌─────────────────────────────────────────────────────────┐
│ Next.js App Router Pages (`app/owner/*`, `app/hr/*`)    │
├─────────────────────────────────────────────────────────┤
│ Domain Controllers & Contexts (`AuthProvider`, etc.)    │
├─────────────────────────────────────────────────────────┤
│ Reusable Feature Primitives (`EnterpriseDataTable`)     │
├─────────────────────────────────────────────────────────┤
│ Design System Primitives (`Button`, `Card`, `Dialog`)  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Enterprise Data Table Guide (`components/data-table/`)

All data tables in SmartERP (Inventory, Employees, Attendance, Payroll, Jobs, Reports) rely on `EnterpriseDataTable<TData>`.

### Quick Start: Creating a New Enterprise Table (in < 3 minutes)

```tsx
import { useMemo } from "react"
import { EnterpriseDataTable } from "@/components/data-table/enterprise-data-table"
import { createColumnHelper, ColumnDef } from "@/components/data-table/data-table-types"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  name: string
  price: number
  status: "active" | "archived"
}

const columnHelper = createColumnHelper<Product>()

export function ProductTable({ data }: { data: Product[] }) {
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      columnHelper.accessor("name", {
        header: "Product Name",
        enableSorting: true,
      }),
      columnHelper.accessor("price", {
        header: "Price",
        enableSorting: true,
        cell: (product) => `$${product.price.toFixed(2)}`,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (product) => (
          <Badge variant={product.status === "active" ? "success" : "secondary"}>
            {product.status}
          </Badge>
        ),
      }),
    ],
    []
  )

  return (
    <EnterpriseDataTable<Product>
      data={data}
      columns={columns}
      getRowId={(p) => p.id}
      searchPlaceholder="Search products..."
      storageKey="products_table"
    />
  )
}
```

---

## 3. Command Palette Plugin Architecture (`useRegisterCommand`)

Feature modules can lazily register commands that appear inside the global `⌘K` palette. Registered commands automatically unregister when the component unmounts.

### Example: Registering a Command in a Feature

```tsx
import { useRegisterCommand } from "@/hooks/useRegisterCommand"
import { Plus } from "lucide-react"

export function InventoryPage() {
  useRegisterCommand({
    id: "action-add-inventory",
    title: "Create New Inventory Item",
    category: "Inventory Actions",
    icon: Plus,
    action: () => openAddModal(),
  })

  return <div>Inventory Page Content</div>
}
```

---

## 4. Best Practices & Do's / Don'ts

### ✅ Do:
* Use `createColumnHelper<TData>()` for full type inference when defining table schemas.
* Memoize table `columns` with `useMemo` to prevent unnecessary re-computations.
* Pass a unique `storageKey` to `EnterpriseDataTable` to automatically save user density and column preferences in `localStorage`.

### ❌ Don't:
* Don't modify backend API logic or authentication tokens inside frontend components.
* Don't duplicate table pagination or sorting code—rely on `EnterpriseDataTable`'s generic hooks.
* Don't use raw hex colors in custom `.css` files—always use semantic Tailwind design tokens (`bg-card`, `border-border/70`, `text-primary`).

---

## 5. Performance, Data Fetching & Caching Standards

### 5.1 Client-Side LocalStorage Caching
When caching dashboard metrics or frequently accessed summary data in the browser:
- **Tenant & User Scoping:** Always namespace cache keys with both `companyId` and `userId`:
  ```ts
  const cacheKey = `smarterp:owner:metrics:${companyId}:${userId}`
  ```
- **Instant Hydration:** Load cache in `useState` initializer or initial effect for sub-10ms UI paint.
- **Visual Stale Indicator:** Show a `"Cached • Syncing..."` badge while background network revalidation is in-flight.
- **Session Cleanup:** Register cache keys in `lib/auth.ts` `signOut()` to wipe tenant data upon logout.

### 5.2 Targeted Single-Entity Loading
- Never download all collection items (`GET /api/jobs`) to render a detail page.
- Use direct single-entity endpoints (`GET /api/jobs/${id}`).
- Parallelize auxiliary requests (e.g. proof-of-work, timeline logs) using `Promise.allSettled` to avoid waterfall latency.

### 5.3 React Hook Dependency Guidelines
- When an asynchronous fetch function is called from `useEffect`, either define it inside the effect or wrap it in `useCallback` with explicit dependencies:
  ```tsx
  const fetchData = useCallback(async () => {
    const res = await apiClient(...)
    setData(res)
  }, [apiClient, filterParam])

  useEffect(() => {
    fetchData()
  }, [fetchData])
  ```
- For module-level lookup dictionaries (e.g., category colors, status maps), define them outside the component function so they do not trigger re-render dependencies.
