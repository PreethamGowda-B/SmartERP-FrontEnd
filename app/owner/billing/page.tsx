"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { BillingView } from "@/components/billing-view"

export default function BillingPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/owner/settings?tab=billing")
  }, [router])

  return (
    <OwnerLayout>
      <div className="p-6">
        <BillingView />
      </div>
    </OwnerLayout>
  )
}
