"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { MaterialsView } from "@/components/materials-view"

export default function OwnerMaterialsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/owner/inventory?tab=materials")
  }, [router])

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <MaterialsView />
      </div>
    </OwnerLayout>
  )
}
