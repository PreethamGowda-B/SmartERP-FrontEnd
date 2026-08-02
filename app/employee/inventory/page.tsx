"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DeprecatedEmployeeInventoryPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/employee/materials?tab=inventory")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center text-xs text-muted-foreground font-bold">
      Redirecting to Materials & Supplies (Stock Viewer)...
    </div>
  )
}
