"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LandingPage } from "@/components/landing-page"
import { Loader2 } from "lucide-react"
import { SyncOverlay } from "@/components/sync-overlay"

export default function HomePage() {
  const { user, isLoading, isSyncing } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading && !isSyncing) {
      router.push(user.role === "owner" ? "/owner" : "/employee")
    }
  }, [user, isLoading, isSyncing, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SyncOverlay />
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <LandingPage />
}
