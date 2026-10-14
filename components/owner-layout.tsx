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

import { safeLocalStorage } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface OwnerLayoutProps {
  children: React.ReactNode
  noPadding?: boolean
}

// ── Enterprise RBAC: only owner, admin, and super_admin may access Owner Portal ──
const OWNER_ROLES = ["owner", "admin", "super_admin"]

export function OwnerLayout({ children, noPadding = false }: OwnerLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || !OWNER_ROLES.includes(user.role))) {
      router.push("/")
    } else if (user && OWNER_ROLES.includes(user.role) && typeof window !== "undefined") {
      const stored = safeLocalStorage.getItem("company_info") || safeLocalStorage.getItem("company_name")
      if (!stored) {
        import("@/lib/apiClient").then(({ apiClient }) => {
          apiClient("/api/settings/company").then((c) => {
            if (c && (c.name || c.legal_name)) {
              safeLocalStorage.setItem("company_info", JSON.stringify(c))
              safeLocalStorage.setItem("smarterp-company-profile", JSON.stringify(c))
              safeLocalStorage.setItem("company_name", c.legal_name || c.name)
            }
          }).catch(() => {})
        })
      }
    }
  }, [user, isLoading, router])

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
    <div className={cn("min-h-screen bg-background", noPadding && "h-dvh overflow-hidden flex flex-col")}>
      <OwnerSidebar />
      <div className={cn("lg:pl-64 pt-14 lg:pt-0", noPadding && "flex-1 flex flex-col h-full min-h-0 overflow-hidden")}>
        <DashboardTrialBanner />
        <MainContent noPadding={noPadding}>{children}</MainContent>
      </div>

      <PageTransition />

      <TrialWelcomeModal />
      <LockedFeaturePrompt />
    </div>
  )
}

function MainContent({ children, noPadding = false }: { children: React.ReactNode; noPadding?: boolean }) {
  const { isActivelyLoading } = useLoading()
  return (
    <main
      className={cn(
        "transition-opacity duration-150 ease-out",
        isActivelyLoading ? "opacity-40" : "opacity-100",
        noPadding
          ? "p-0 pb-0 sm:pb-0 h-[calc(100dvh-3.5rem)] lg:h-dvh overflow-hidden flex flex-col flex-1 min-h-0"
          : "p-4 lg:p-6 pb-24 sm:pb-28"
      )}
    >
      {children}
    </main>
  )
}
