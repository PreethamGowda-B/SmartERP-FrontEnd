"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { EmployeeSidebar } from "@/components/employee-sidebar"
import { useLoading } from "@/contexts/loading-context"
import PageTransition from './page-transition'
import DotsLoader from '@/components/dots-loader'
import { useLocationTracking } from "@/hooks/useLocationTracking"
import { useNotifications } from "@/contexts/notification-context"
import { cn } from "@/lib/utils"

interface EmployeeLayoutProps {
  children: React.ReactNode
}

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { user, isLoading } = useAuth()
  const { isConnected } = useNotifications()
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
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border/50 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 shadow-inner">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
              )} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {isConnected ? "Live Stream Active" : "Reconnecting..."}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black tracking-tight">{user?.name}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user?.role} Portal</p>
            </div>
          </div>
        </header>

        <MainContent>{children}</MainContent>
      </div>

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
