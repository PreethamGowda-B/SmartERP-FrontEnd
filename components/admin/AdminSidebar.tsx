"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldCheck,
  ShieldAlert,
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Megaphone,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Brain,
  ScrollText,
  Activity,
  Zap,
  Radio,
  ExternalLink,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, isRouteActive } from "@/lib/utils"
import { apiClient } from "@/lib/apiClient"

interface NavItem {
  name: string
  icon: React.ElementType
  href: string
  badge?: string
  badgeColor?: string
}

interface NavGroup {
  category: string
  items: NavItem[]
}

interface AdminSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isMobile?: boolean
  closeMobile?: () => void
}

export function AdminSidebar({
  isOpen,
  setIsOpen,
  isMobile = false,
  closeMobile
}: AdminSidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [threatLevel, setThreatLevel] = useState<string | null>(null)

  // Determine dynamic prefix: /superadmin or [adminRoute]
  const pathParts = pathname.split('/')
  const baseSegment = pathParts[1] || "superadmin"
  const secretPrefix = `/${baseSegment}`

  // Fetch threat level on mount
  useEffect(() => {
    let isMounted = true
    const checkThreat = async () => {
      try {
        const res = await apiClient<{ success: boolean; stats?: any }>("/api/v1/superadmin/security/dashboard")
        if (isMounted && res?.stats?.healthStatus?.threatLevel) {
          setThreatLevel(res.stats.healthStatus.threatLevel)
        }
      } catch (_) {
        // Fallback gracefully
      }
    }
    checkThreat()
    const interval = setInterval(checkThreat, 45000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const navGroups: NavGroup[] = [
    {
      category: "Platform Core",
      items: [
        { name: "Overview", icon: LayoutDashboard, href: "" },
        { name: "Analytics & BI", icon: BarChart3, href: "/analytics" },
      ]
    },
    {
      category: "Tenant & Identity",
      items: [
        { name: "Companies", icon: Building2, href: "/companies" },
        { name: "Users & IAM", icon: Users, href: "/users" },
        { name: "Subscriptions & Billing", icon: CreditCard, href: "/billing" },
      ]
    },
    {
      category: "Security & Intelligence",
      items: [
        { 
          name: "Security Center", 
          icon: ShieldAlert, 
          href: "/security",
          badge: threatLevel === "CRITICAL" ? "CRITICAL" : threatLevel === "HIGH" ? "HIGH" : threatLevel === "ELEVATED" ? "ALERT" : "NORMAL",
          badgeColor: threatLevel === "CRITICAL" ? "bg-rose-50 text-rose-700 border-rose-200" : threatLevel === "HIGH" ? "bg-amber-50 text-amber-700 border-amber-200" : threatLevel === "ELEVATED" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
        },
        { name: "AI Operations", icon: Brain, href: "/ai-operations" },
        { name: "System Health", icon: Activity, href: "/system-health" },
      ]
    },
    {
      category: "Governance & Operations",
      items: [
        { name: "Global Broadcasts", icon: Megaphone, href: "/announcements" },
        { name: "Feedback & Tickets", icon: MessageSquare, href: "/feedback" },
        { name: "System Logs & Audit", icon: ScrollText, href: "/logs" },
        { name: "Settings & Control", icon: Settings, href: "/settings" },
      ]
    }
  ]

  const allHrefs = navGroups.flatMap(g => g.items.map(i => `${secretPrefix}${i.href}`))

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out font-sans select-none z-30",
        isMobile ? "w-72 h-full" : isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 bg-white">
        <Link 
          href={secretPrefix} 
          prefetch={false}
          onClick={() => isMobile && closeMobile?.()}
          className="flex items-center gap-3 overflow-hidden group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {(isOpen || isMobile) && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-slate-900 truncate flex items-center gap-1.5">
                SmartERP <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 tracking-wider">Super Admin</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 truncate">Platform Control Plane</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            {(isOpen || isMobile) ? (
              <p className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-1.5">
                {group.category}
              </p>
            ) : (
              <div className="h-px bg-slate-100 my-2 mx-2" />
            )}

            {group.items.map((item) => {
              const fullHref = `${secretPrefix}${item.href}`
              const isActive = isRouteActive(pathname, fullHref, allHrefs)

              return (
                <Link
                  key={item.name}
                  href={fullHref}
                  prefetch={false}
                  onClick={() => isMobile && closeMobile?.()}
                  title={!isOpen && !isMobile ? item.name : undefined}
                >
                  <div
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 text-xs font-semibold group",
                      isActive
                        ? "bg-indigo-50/80 text-indigo-700 font-bold border border-indigo-200/60 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                        isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    {(isOpen || isMobile) && (
                      <span className="truncate flex-1 tracking-tight">{item.name}</span>
                    )}

                    {(isOpen || isMobile) && item.badge && (
                      <Badge className={cn("text-[9px] font-bold px-1.5 py-0 h-4 border uppercase tracking-wider shrink-0", item.badgeColor)}>
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 space-y-2">
        {(isOpen || isMobile) ? (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate text-slate-900">{user?.name || "Super Admin"}</span>
                <span className="text-[10px] text-slate-500 truncate">{user?.email || "superadmin@prozync.in"}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sign out of Super Admin"
              className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Sign out"
            className="w-full h-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  )
}
