"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LandingPage } from "@/components/landing-page"
import { Loader2 } from "lucide-react"

// Metadata is set in layout.tsx with canonical URL

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect once we know for certain a user is logged in
    if (user && !isLoading) {
      if (user.role === "owner") {
        router.push("/owner")
      } else if (user.role === "hr") {
        router.push("/hr")
      } else {
        router.push("/employee")
      }
    }
  }, [user, isLoading, router])

  // If a confirmed logged-in user is being redirected, show spinner
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Show landing page immediately — for new/unauthenticated users
  // isLoading=true just means auth hasn't resolved yet, not that a user exists
  return <LandingPage />
}
