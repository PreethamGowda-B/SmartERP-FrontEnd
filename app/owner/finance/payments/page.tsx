"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { PaymentsView } from "@/components/payments-view"

export default function OwnerPaymentsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/owner/finance/invoices?tab=payments")
  }, [router])

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <PaymentsView />
      </div>
    </OwnerLayout>
  )
}
