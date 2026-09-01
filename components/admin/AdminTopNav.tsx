"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Menu,
  Bell,
  Search,
  RefreshCw,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Command,
  ExternalLink,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { apiClient } from "@/lib/apiClient"

interface AdminTopNavProps {
  onOpenMobileMenu: () => void
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export function AdminTopNav({
  onOpenMobileMenu,
  onToggleSidebar,
  isSidebarOpen
}: AdminTopNavProps) {
  const pathname = usePathname()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  // Map route segment to human-readable breadcrumb title
  const pathParts = pathname.split('/').filter(Boolean)
  const baseSegment = pathParts[0] || "superadmin"
  const sectionSegment = pathParts[1] || ""

  const routeTitleMap: Record<string, { title: string; category: string }> = {
    "": { title: "Overview Dashboard", category: "Platform Core" },
    "analytics": { title: "Analytics & Intelligence", category: "Platform Core" },
    "companies": { title: "Company Registry", category: "Tenant & Identity" },
    "users": { title: "User & IAM Directory", category: "Tenant & Identity" },
    "billing": { title: "Subscriptions & Billing", category: "Tenant & Identity" },
    "security": { title: "Security Operations Center", category: "Security & Intelligence" },
    "ai-operations": { title: "AI Operations & Audit", category: "Security & Intelligence" },
    "system-health": { title: "System Health & Telemetry", category: "Security & Intelligence" },
    "announcements": { title: "Global Broadcast Center", category: "Governance & Ops" },
    "feedback": { title: "Feedback & Ticket Hub", category: "Governance & Ops" },
    "logs": { title: "System Logs & Audit Trail", category: "Governance & Ops" },
    "settings": { title: "System Control & Settings", category: "Governance & Ops" },
  }

  const currentMeta = routeTitleMap[sectionSegment] || { title: "Platform Hub", category: "Super Admin" }

  // Quick ping for server status
  const checkHealth = async () => {
    try {
      const start = Date.now()
      await apiClient("/api/health").catch(() => null)
      setLatencyMs(Date.now() - start)
    } catch (_) {
      setLatencyMs(null)
    }
  }

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    // Dispatch custom event so active page view can re-fetch
    window.dispatchEvent(new CustomEvent("smarterp:admin:refresh"))
    setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
  }

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 font-sans shadow-2xs">
      {/* Left Breadcrumb & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold">
          <Link
            href={`/${baseSegment}`}
            prefetch={false}
            className="text-slate-400 hover:text-slate-700 transition-colors hidden sm:inline"
          >
            {currentMeta.category}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:inline" />
          <span className="text-slate-900 font-bold tracking-tight text-sm truncate max-w-[200px] sm:max-w-none">
            {currentMeta.title}
          </span>
        </nav>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-2.5">
        {/* Real-time System Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200 text-[11px] font-bold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Systems Operational</span>
          {latencyMs !== null && (
            <span className="text-[10px] text-emerald-600 font-mono font-medium pl-1 border-l border-emerald-200">
              {latencyMs}ms
            </span>
          )}
        </div>

        {/* Global Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="h-8 px-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl border-slate-200 shadow-2xs gap-1.5"
          title="Refresh Current Dashboard Telemetry"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {/* Tenant Environment Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-[11px] font-mono font-semibold text-slate-600">
          <Activity className="h-3.5 w-3.5 text-indigo-600" />
          <span>Production Multi-Tenant</span>
        </div>
      </div>
    </header>
  )
}
