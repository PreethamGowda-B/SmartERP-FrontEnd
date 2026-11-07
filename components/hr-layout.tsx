"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { HRSidebar } from "@/components/hr-sidebar"
import { AIChatBot } from "@/components/ai-chat-bot"
import { useLoading } from "@/contexts/loading-context"
import PageTransition from './page-transition'
import DotsLoader from '@/components/dots-loader'
import { cn } from "@/lib/utils"

interface HRLayoutProps {
  children: React.ReactNode
}

export function HRLayout({ children }: HRLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "hr" && user.role !== "owner"))) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HRSidebar />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <main className="flex-1 p-8 space-y-6">
            <div className="h-8 w-48 bg-muted/80 animate-pulse rounded-lg" />
            <div className="h-64 w-full bg-muted/40 animate-pulse rounded-xl" />
          </main>
        </div>
      </div>
    )
  }

  if (!user || (user.role !== "hr" && user.role !== "owner")) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <HRSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0">
        <MainContent>{children}</MainContent>
      </div>

      <PageTransition />
    </div>
  )
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { isActivelyLoading } = useLoading()
  return (
    <main
      className={cn(
        "p-3 sm:p-4 lg:p-6 pb-24 sm:pb-28 transition-opacity duration-150 ease-out",
        isActivelyLoading ? "opacity-50" : "opacity-100"
      )}>
      {children}
    </main>
  )
}
