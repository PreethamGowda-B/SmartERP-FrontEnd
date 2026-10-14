"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { ForecastsView } from "@/components/forecasts-view"

export default function InventoryForecastsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/owner/inventory?tab=forecasts")
  }, [router])

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <ForecastsView />
      </div>
    </OwnerLayout>
  )
}
