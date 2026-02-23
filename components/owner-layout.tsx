"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { OwnerSidebar } from "@/components/owner-sidebar"
import { AIChatBot } from "@/components/ai-chat-bot"
import { NavLoadingProvider, useNavLoading } from '@/components/nav-loading-context'
import PageTransition from './page-transition'
import DotsLoader from '@/components/dots-loader'

interface OwnerLayoutProps {
  children: React.ReactNode
}

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()


  useEffect(() => {
    if (!isLoading && (!user || user.role !== "owner")) {
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

  if (!user || user.role !== "owner") {
    // User is not authorized for this layout. The useEffect will redirect to
    // the home page — return null here to avoid showing a full-screen loader
    // or blank centered content during the redirect.
    return null
  }

  return (
    <NavLoadingProvider>
      <div className="min-h-screen bg-background">
        <OwnerSidebar />
        <div className="lg:pl-64">
          <MainContent>{children}</MainContent>
        </div>

        <AIChatBot />

        <PageTransition />
      </div>
    </NavLoadingProvider>
  )
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { loadingId } = useNavLoading()
  return (
    <main
      className={`p-4 lg:p-8 transition-all duration-400 ease-in-out ${loadingId ? 'opacity-30 translate-y-2' : 'opacity-100 translate-y-0'}`}>
      {children}
    </main>
  )
}
