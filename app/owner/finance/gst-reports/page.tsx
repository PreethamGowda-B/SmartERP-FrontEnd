"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DeprecatedGstReportsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/owner/finance/gst")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center text-xs text-muted-foreground font-bold">
      Redirecting to unified GST & Tax Command Center...
    </div>
  )
}
