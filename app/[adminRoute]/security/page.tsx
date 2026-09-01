"use client"

import { AdminLayout } from "@/components/admin-layout"
import { SecurityDashboardView } from "@/components/security/SecurityDashboardView"

export default function SuperAdminSecurityPage() {
  return (
    <AdminLayout>
      <div className="p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <SecurityDashboardView />
      </div>
    </AdminLayout>
  )
}
