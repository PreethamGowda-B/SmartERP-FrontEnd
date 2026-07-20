"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LandingPage } from "@/components/landing-page"
import { Loader2 } from "lucide-react"

// Metadata is set in layout.tsx with canonical URL

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  // Track whether we have verified the user is genuinely authenticated
  // (not just from a stale cache read). We wait a short window for the
  // background refresh to complete before deciding to redirect.
  const [authVerified, setAuthVerified] = useState(false)

  useEffect(() => {
    // Give the background token refresh enough time to either confirm or
    // invalidate the cached user (it runs immediately in auth-context).
    // 600ms is enough for a warm server; on cold start the refresh will fail
    // anyway and setUser(null) will be called, preventing the redirect.
    const timer = setTimeout(() => setAuthVerified(true), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authVerified && user && !isLoading) {
      if (user.role === "owner") {
        router.push("/owner")
      } else if (user.role === "hr") {
        router.push("/hr")
      } else if (user.role === "employee") {
        router.push("/employee")
      }
    }
  }, [user, isLoading, authVerified, router])

  // Show spinner only during the initial auth check, not indefinitely
  if (isLoading || (!authVerified && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <LandingPage />
}
