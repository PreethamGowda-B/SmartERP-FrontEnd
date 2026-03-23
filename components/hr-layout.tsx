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
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ width: 160, height: 100 }} className="flex items-center justify-center bg-white rounded-lg shadow-md">
          <DotsLoader />
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
      <div className="lg:pl-64">
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
      className={`p-4 lg:p-8 transition-all duration-400 ease-in-out ${isActivelyLoading ? 'opacity-30 translate-y-2 blur-[2px]' : 'opacity-100 translate-y-0 filter-none'}`}>
      {children}
    </main>
  )
}
