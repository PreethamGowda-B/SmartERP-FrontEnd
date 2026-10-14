"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { SupportView } from "@/components/support-view"

export default function SupportPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/owner/settings?tab=support")
  }, [router])

  return (
    <OwnerLayout>
      <div className="p-6">
        <SupportView />
      </div>
    </OwnerLayout>
  )
}
