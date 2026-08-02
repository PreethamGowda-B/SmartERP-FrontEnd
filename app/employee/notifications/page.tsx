"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DeprecatedEmployeeNotificationsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/employee/messages?tab=notifications")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center text-xs text-muted-foreground font-bold">
      Redirecting to Messages & Alerts...
    </div>
  )
}
