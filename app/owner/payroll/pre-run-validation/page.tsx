"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { PayrollAuditView } from "@/components/payroll-audit-view"

export default function PayrollPreRunValidationPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/owner/payroll?tab=audit")
  }, [router])

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <PayrollAuditView />
      </div>
    </OwnerLayout>
  )
}
