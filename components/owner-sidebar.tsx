"use client"

import { useState, useEffect } from "react"
import { NavLink } from "@/components/nav-link"
import { apiClient } from "@/lib/apiClient"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  Building2,
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  Package,
  DollarSign,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Box,
  MessageSquare,
  MapPin,
  CreditCard,
  Headset,
  Megaphone,
  Files,
  UserCheck,
  ChevronRight,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { logger } from "@/lib/logger"

// ── Nav groups ────────────────────────────────────────────────────────────────
const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/owner", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Tasks", href: "/owner/jobs", icon: Briefcase },
      { name: "Customer Jobs", href: "/owner/customer-jobs", icon: UserCheck },
      { name: "Employees", href: "/owner/employees", icon: Users },
      { name: "Attendance", href: "/owner/attendance", icon: Clock },
      { name: "Tracking", href: "/owner/tracking", icon: MapPin, feature: "location_tracking" },
    ],
  },
  {
    label: "Resources",
    items: [
      { name: "Materials", href: "/owner/materials", icon: Package },
      { name: "Inventory", href: "/owner/inventory", icon: Box },
      { name: "Documents", href: "/owner/documents", icon: Files },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Payroll", href: "/owner/payroll", icon: DollarSign, feature: "payroll" },
      { name: "Reports", href: "/owner/reports", icon: BarChart3 },
      { name: "Billing", href: "/owner/billing", icon: CreditCard },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Messages", href: "/owner/messages", icon: MessageSquare, feature: "messages" },
      { name: "Notifications", href: "/owner/notifications", icon: Bell },
      { name: "HR Hub", href: "/owner/hr-hub", icon: Megaphone },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Settings", href: "/owner/settings", icon: Settings },
      { name: "Support", href: "/owner/support", icon: Headset, feature: "priority_support" },
    ],
  },
]

export function OwnerSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [features, setFeatures] = useState<Record<string, boolean>>({
    payroll: false,
    messages: false,
    location_tracking: false,
    priority_support: false,
  })
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await apiClient("/api/subscription/status")
        if (res?.plan?.features) {
          setFeatures(res.plan.features)
        }
      } catch (err) {
        logger.error("Sidebar failed to fetch plan status:", err)
      }
    }
    fetchPlan()
  }, [])

  const isVisible = (item: { feature?: string }) => {
    if (!item.feature) return true
    return !!features[item.feature]
  }

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-card/80 backdrop-blur-sm shadow-sm"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          "bg-sidebar border-r border-sidebar-border",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* ── Logo header ─────────────────────────────────────────── */}
        <div className="px-5 py-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 mb-4">
            {/* Gradient logo mark */}
            <div className="relative w-8 h-8 shrink-0">
              <div className="absolute inset-0 rounded-lg bg-primary opacity-15 blur-sm" />
              <div className="relative w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight leading-none">SmartERP</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">Owner Portal</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(isVisible)
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                <p className="px-2 mb-1 text-[10px] font-medium tracking-widest uppercase text-muted-foreground/50 select-none">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <NavLink
                        key={item.name}
                        href={item.href}
                        id={item.name}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group relative",
                          isActive
                            ? "bg-primary/10 text-primary font-medium nav-active-glow"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent font-normal",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <span className="flex-1 truncate">{item.name}</span>
                        {isActive && (
                          <ChevronRight className="h-3 w-3 text-primary/60 shrink-0" />
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── User footer ─────────────────────────────────────────── */}
        <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors mb-1">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
                <span className="text-xs font-medium text-primary">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 ring-1 ring-sidebar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-normal">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-150 font-normal"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
