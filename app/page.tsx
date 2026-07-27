"use client"

import { useAuth } from "@/contexts/auth-context"
import { LandingPage } from "@/components/landing-page"

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="relative">
      {/* If logged-in user visits root landing page, display top notification bar for quick workspace access */}
      {user && (
        <div className="bg-primary text-primary-foreground text-xs py-2 px-4 text-center flex items-center justify-center gap-3 font-semibold shadow-xs z-50 relative">
          <span>You are signed in as <strong>{user.name || user.email}</strong></span>
          <a
            href={user.role === "owner" ? "/owner" : user.role === "hr" ? "/hr" : "/employee"}
            className="underline hover:text-white transition-colors bg-primary-foreground/20 px-2.5 py-1 rounded-md"
          >
            Go to Workspace Dashboard →
          </a>
        </div>
      )}
      <LandingPage />
    </div>
  )
}
