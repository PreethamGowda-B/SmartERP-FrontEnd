"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, ChevronLeft, ChevronRight, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { logger } from "@/lib/logger"
import { apiClient } from "@/lib/apiClient"
import { AdminSidebar } from "./admin/AdminSidebar"
import { AdminTopNav } from "./admin/AdminTopNav"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [platformAccess, setPlatformAccess] = useState<'checking' | 'allowed' | 'denied' | 'unavailable'>('checking')
  const [accessRetry, setAccessRetry] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const userId = user?.id

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // The API is authoritative because it also supports the configured platform-admin email exception.
  useEffect(() => {
    if (isLoading) return
    if (!userId) {
      setPlatformAccess('denied')
      router.replace("/superadmin/login")
      return
    }

    let active = true
    setPlatformAccess('checking')
    apiClient<{ authorized: boolean }>("/api/admin/access")
      .then((result) => {
        if (active) setPlatformAccess(result?.authorized ? 'allowed' : 'denied')
      })
      .catch((error: any) => {
        if (!active) return
        if (error?.status === 401 || error?.status === 403) {
          logger.warn("🚫 Access denied: platform admin authorization failed")
          setPlatformAccess('denied')
          router.replace("/superadmin/login")
        } else {
          setPlatformAccess('unavailable')
        }
      })
    return () => { active = false }
  }, [userId, isLoading, accessRetry, router])

  if (!mounted || isLoading || platformAccess === 'checking') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="text-slate-700 font-semibold tracking-tight text-sm">Verifying platform administrator access...</p>
        <p className="text-slate-400 text-xs mt-1">SmartERP Enterprise Security Guard</p>
      </div>
    )
  }

  if (platformAccess === 'denied') return null

  if (platformAccess === 'unavailable') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900 font-sans">
        <p className="text-sm font-semibold">Platform access could not be verified because the API is unavailable.</p>
        <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold" onClick={() => setAccessRetry((value) => value + 1)}>
          Retry verification
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50/60 text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex relative shrink-0">
        <AdminSidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center shadow-sm border border-slate-200 hover:bg-slate-50 hover:scale-105 transition-all z-40 focus:outline-none"
        >
          {isSidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay / Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            {/* Off-canvas Sheet */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-50 h-full shadow-2xl flex"
            >
              <AdminSidebar
                isOpen={true}
                setIsOpen={() => {}}
                isMobile={true}
                closeMobile={() => setIsMobileMenuOpen(false)}
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 -right-10 w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-md focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/60">
        {/* Top Navigation */}
        <AdminTopNav
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
