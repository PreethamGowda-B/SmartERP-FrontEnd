"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { EmployeeSidebar } from "@/components/employee-sidebar"
import { AIChatBot } from "@/components/ai-chat-bot"
import { useLoading } from "@/contexts/loading-context"
import PageTransition from './page-transition'
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import DotsLoader from '@/components/dots-loader'
import { useLocationTracking } from "@/hooks/useLocationTracking"

interface EmployeeLayoutProps {
  children: React.ReactNode
}

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // ── Location tracking (runs on every employee page) ──────────────────────
  // Must be called at the top level to follow the Rules of Hooks
  useLocationTracking({})
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "employee")) {
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

  if (!user || user.role !== "employee") {
    // User is not authorized for this layout. The useEffect will redirect to
    // the home page — return null here to avoid showing a full-screen loader
    // or blank centered content during the redirect.
    return null
  }

  // ── Location tracking (runs on every employee page) ──────────────────────
  // Must be called at the top level to follow the Rules of Hooks
  // useLocationTracking is also called once at the top
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <EmployeeSidebar />
      <div className="lg:pl-64">
        <MainContent>{children}</MainContent>
      </div>

      <AIChatBot />
      <PageTransition />
    </div>
  )
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { isActivelyLoading } = useLoading()
  return (
    <main className={`p-4 lg:p-8 transition-all duration-400 ease-in-out ${isActivelyLoading ? 'opacity-30 translate-y-2 blur-[2px]' : 'opacity-100 translate-y-0 filter-none'}`}>
      {children}
    </main>
  )
}
