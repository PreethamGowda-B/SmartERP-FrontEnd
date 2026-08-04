"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { OwnerSidebar } from "@/components/owner-sidebar"
import { AIChatBot } from "@/components/ai-chat-bot"
import { useLoading } from "@/contexts/loading-context"
import PageTransition from './page-transition'
import DotsLoader from '@/components/dots-loader'
import { TrialWelcomeModal } from '@/components/trial-welcome-modal'
import { LockedFeaturePrompt } from '@/components/locked-feature-prompt'
import { DashboardTrialBanner } from '@/components/dashboard-trial-banner'

interface OwnerLayoutProps {
  children: React.ReactNode
}

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()


  // ── Enterprise RBAC: only owner, admin, and super_admin may access Owner Portal ──
  const OWNER_ROLES = ["owner", "admin", "super_admin"]

  useEffect(() => {
    if (!isLoading && (!user || !OWNER_ROLES.includes(user.role))) {
      router.push("/")
    } else if (user && OWNER_ROLES.includes(user.role) && typeof window !== "undefined") {
      const stored = localStorage.getItem("company_info") || localStorage.getItem("company_name")
      if (!stored) {
        import("@/lib/apiClient").then(({ apiClient }) => {
          apiClient("/api/settings/company").then((c) => {
            if (c && (c.name || c.legal_name)) {
              localStorage.setItem("company_info", JSON.stringify(c))
              localStorage.setItem("smarterp-company-profile", JSON.stringify(c))
              localStorage.setItem("company_name", c.legal_name || c.name)
            }
          }).catch(() => {})
        })
      }
    }
  }, [user?.id, user?.role, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <OwnerSidebar />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <main className="flex-1 p-8 space-y-6">
            <div className="h-8 w-48 bg-muted/80 animate-pulse rounded-lg" />
            <div className="h-64 w-full bg-muted/40 animate-pulse rounded-xl" />
          </main>
        </div>
      </div>
    )
  }

  if (!user || !OWNER_ROLES.includes(user.role)) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <OwnerSidebar />
      <div className="lg:pl-64">
        <DashboardTrialBanner />
        <MainContent>{children}</MainContent>
      </div>

      <PageTransition />

      <TrialWelcomeModal />
      <LockedFeaturePrompt />
    </div>
  )
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { isActivelyLoading } = useLoading()
  return (
    <main
      className={`p-4 lg:p-8 transition-all duration-400 ease-in-out ${isActivelyLoading ? 'opacity-30 translate-y-2 blur-[2px]' : 'opacity-100 translate-y-0 filter-none'}`}>
      {children}
    </main>
  )
}
