"use client"

import { useState, useEffect, useRef } from "react"
import { NavLink } from "@/components/nav-link"
import { apiClient } from "@/lib/apiClient"
import { usePathname, useRouter } from "next/navigation"
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
  Flame,
  ShieldCheck,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenterDrawer } from "@/components/notification-center-drawer"
import { logger } from "@/lib/logger"

const navCategories = [
  {
    title: "Operations",
    items: [
      { name: "Dashboard", href: "/owner", icon: LayoutDashboard },
      { name: "Tasks", href: "/owner/jobs", icon: Briefcase },
      { name: "Customer Jobs", href: "/owner/customer-jobs", icon: UserCheck },
      { name: "Sales Pipeline", href: "/owner/crm/pipeline", icon: Flame },
      { name: "Tracking", href: "/owner/tracking", icon: MapPin },
    ],
  },
  {
    title: "People & HR",
    items: [
      { name: "Employees", href: "/owner/employees", icon: Users },
      { name: "Attendance", href: "/owner/attendance", icon: Clock },
      { name: "Payroll", href: "/owner/payroll", icon: DollarSign },
      { name: "Payroll Audit", href: "/owner/payroll/pre-run-validation", icon: ShieldCheck },
      { name: "HR Hub", href: "/owner/hr-hub", icon: Megaphone },
    ],
  },
  {
    title: "Supplies & Docs",
    items: [
      { name: "Materials", href: "/owner/materials", icon: Package },
      { name: "Inventory", href: "/owner/inventory", icon: Box },
      { name: "Demand Forecasts", href: "/owner/inventory/forecasts", icon: Box },
      { name: "Documents", href: "/owner/documents", icon: Files },
    ],
  },
  {
    title: "Communication & Insights",
    items: [
      { name: "Messages", href: "/owner/messages", icon: MessageSquare },
      { name: "Notifications", href: "/owner/notifications", icon: Bell },
      { name: "Reports", href: "/owner/reports", icon: BarChart3 },
      { name: "GST Reconcile", href: "/owner/gst-reconciliation", icon: Files },
      { name: "AR Collections", href: "/owner/ar-collections", icon: DollarSign },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Settings", href: "/owner/settings", icon: Settings },
      { name: "Billing", href: "/owner/billing", icon: CreditCard },
      { name: "Contact Support", href: "/owner/support", icon: Headset },
    ],
  },
]

export function OwnerSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [features, setFeatures] = useState<Record<string, boolean>>({
    payroll: false,
    messages: false,
    location_tracking: false,
    priority_support: false
  })
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const navRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  // Persist sidebar scroll position across route changes
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const saved = sessionStorage.getItem("owner_sidebar_scroll")
    if (saved) nav.scrollTop = parseInt(saved, 10)
  }, [pathname])

  const handleNavScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem("owner_sidebar_scroll", String(navRef.current.scrollTop))
    }
  }

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await apiClient("/api/subscription/status")
        if (res && res.plan && res.plan.features) {
          setFeatures(res.plan.features)
        }
      } catch (err) {
        logger.error("Sidebar failed to fetch plan status:", err)
      }
    }
    fetchPlan()
  }, [])

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xs",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-border/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">SmartERP</h1>
              <p className="text-xs text-muted-foreground">Owner Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationCenterDrawer />
            <ThemeToggle />
          </div>
        </div>

        {/* Scrollable nav area */}
        <div ref={navRef} onScroll={handleNavScroll} className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {navCategories.map((category) => {
            const filteredItems = category.items.filter((item) => {
              if (item.name === "Messages" && !features.messages) return false
              if (item.name === "Payroll" && !features.payroll) return false
              if (item.name === "Tracking" && !features.location_tracking) return false
              if (item.name === "Contact Support" && !features.priority_support) return false
              return true
            })

            if (filteredItems.length === 0) return null

            return (
              <div key={category.title} className="space-y-1">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {category.title}
                </p>
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <NavLink
                        key={item.name}
                        href={item.href}
                        id={item.name}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/70",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer - user info */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  )
}

