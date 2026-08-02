"use client"

import { useState, useEffect, useRef } from "react"
import { NavLink } from "@/components/nav-link"
import { apiClient } from "@/lib/apiClient"
import { usePathname, useRouter } from "next/navigation"
import { cn, isRouteActive } from "@/lib/utils"
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
    title: "Finance & Accounting",
    items: [
      { name: "Finance Hub", href: "/owner/finance", icon: DollarSign },
      { name: "Invoices", href: "/owner/finance/invoices", icon: Files },
      { name: "Invoice Issues", href: "/owner/invoice-issues", icon: ShieldCheck },
      { name: "Payments", href: "/owner/finance/payments", icon: CreditCard },
      { name: "AR Aging", href: "/owner/finance/accounts-receivable", icon: Clock },
      { name: "GST Reports", href: "/owner/finance/gst-reports", icon: ShieldCheck },
      { name: "GST Reconcile", href: "/owner/finance/gst-reconciliation", icon: Files },
    ],
  },
  {
    title: "Communication & Insights",
    items: [
      { name: "Messages", href: "/owner/messages", icon: MessageSquare },
      { name: "Notifications", href: "/owner/notifications", icon: Bell },
      { name: "Reports", href: "/owner/reports", icon: BarChart3 },
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

const allNavHrefs = navCategories.flatMap((cat) => cat.items.map((i) => i.href))

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
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur border-b px-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <span className="font-extrabold text-sm tracking-tight text-foreground">SmartERP</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenterDrawer />
          <ThemeToggle compact />
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xs",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border/80 flex items-center justify-between shrink-0 bg-sidebar/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 shadow-xs">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-foreground">SmartERP</h1>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Owner Portal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationCenterDrawer />
            <ThemeToggle compact />
          </div>
        </div>

        {/* Scrollable nav area */}
        <div ref={navRef} onScroll={handleNavScroll} className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {navCategories.map((category) => {
            const filteredItems = category.items

            return (
              <div key={category.title} className="space-y-1.5">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {category.title}
                </p>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = isRouteActive(pathname, item.href, allNavHrefs)
                    return (
                      <NavLink
                        key={item.name}
                        href={item.href}
                        id={item.name}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 relative group",
                          isActive
                            ? "bg-primary/15 text-primary font-bold border-l-2 border-primary shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/75 hover:translate-x-0.5",
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "text-primary")} />
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
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <div className="p-3 rounded-xl bg-sidebar-accent/40 border border-sidebar-border/60 backdrop-blur-xs">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "O"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user?.name || "Owner User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  )
}

