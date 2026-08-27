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
  Radio,
  Award,
  ShoppingBag,
  Navigation,
  Zap,
  Bot,
  Cpu,
  ChevronDown,
  ChevronRight,
  Layers,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenterDrawer } from "@/components/notification-center-drawer"
import { logger } from "@/lib/logger"

export interface NavLeafItem {
  name: string
  href: string
  icon: any
  isGroup?: false
}

export interface NavGroupItem {
  name: string
  icon: any
  isGroup: true
  children: NavLeafItem[]
}

export type NavItem = NavLeafItem | NavGroupItem

export interface NavCategory {
  title: string
  items: NavItem[]
}

const navCategories: NavCategory[] = [
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
    title: "CNC Service Edition",
    items: [
      {
        name: "Command Center",
        icon: Radio,
        isGroup: true,
        children: [
          { name: "Command Center", href: "/owner/cnc/command-center", icon: Radio },
          { name: "Executive BI", href: "/owner/cnc/bi", icon: BarChart3 },
          { name: "AI Audit Trail", href: "/owner/cnc/ai-activity", icon: Bot },
        ],
      },
      {
        name: "Service Operations",
        icon: Cpu,
        isGroup: true,
        children: [
          { name: "Machine Registry", href: "/owner/machines", icon: Cpu },
          { name: "SLA Management", href: "/owner/cnc/sla", icon: Clock },
          { name: "Dispatch Routes", href: "/owner/cnc/route-optimization", icon: Navigation },
          { name: "Automations", href: "/owner/cnc/automations", icon: Zap },
        ],
      },
      {
        name: "Supply & Warranty",
        icon: Award,
        isGroup: true,
        children: [
          { name: "Supplier Warranty", href: "/owner/cnc/warranty", icon: Award },
          { name: "Vendors & POs", href: "/owner/cnc/vendors", icon: ShoppingBag },
        ],
      },
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
      { name: "Invoices & Billing", href: "/owner/finance/invoices", icon: Files },
      { name: "Payments & AR", href: "/owner/finance/payments", icon: CreditCard },
      { name: "GST & Tax", href: "/owner/finance/gst", icon: ShieldCheck },
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

const allNavHrefs: string[] = navCategories.flatMap((cat) =>
  cat.items.flatMap((i) => {
    if (i.isGroup) {
      return i.children.map((c) => c.href)
    }
    return [i.href]
  })
)

const STORAGE_KEY_GROUPS = "smarterp_owner_sidebar_groups"

export function OwnerSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") {
      return { "Command Center": true, "Service Operations": true, "Supply & Warranty": true }
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GROUPS)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (_) {}
    return { "Command Center": true, "Service Operations": true, "Supply & Warranty": true }
  })

  const [features, setFeatures] = useState<Record<string, boolean>>({
    payroll: false,
    messages: false,
    location_tracking: false,
    priority_support: false,
  })
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const navRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  // Automatically expand group containing the currently active route
  useEffect(() => {
    for (const cat of navCategories) {
      for (const item of cat.items) {
        if ("isGroup" in item && item.isGroup) {
          const hasActiveChild = item.children.some((c) => isRouteActive(pathname, c.href, allNavHrefs))
          if (hasActiveChild && !openGroups[item.name]) {
            setOpenGroups((prev) => {
              const updated = { ...prev, [item.name]: true }
              try {
                localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updated))
              } catch (_) {}
              return updated
            })
          }
        }
      }
    }
  }, [pathname, openGroups])

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => {
      const nextState = !prev[groupName]
      const updated = { ...prev, [groupName]: nextState }
      try {
        localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updated))
      } catch (_) {}
      return updated
    })
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
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
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
      <aside
        aria-label="Owner navigation sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xs",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border/80 flex items-center justify-between shrink-0 bg-sidebar/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5 flex-nowrap whitespace-nowrap shrink-0 min-w-0">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 shadow-xs shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col min-w-0 flex-nowrap whitespace-nowrap">
              <h1 className="text-sm font-black tracking-tight text-foreground truncate flex-nowrap whitespace-nowrap">
                SmartERP
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex-nowrap whitespace-nowrap w-fit">
                Owner Portal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <NotificationCenterDrawer />
            <ThemeToggle compact />
          </div>
        </div>

        {/* Scrollable nav area */}
        <div
          ref={navRef}
          onScroll={handleNavScroll}
          className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        >
          {navCategories.map((category) => {
            return (
              <div key={category.title} className="space-y-1.5">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {category.title}
                </p>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    // 1. Group / Expandable Section (e.g. CNC Service Edition Sections)
                    if ("isGroup" in item && item.isGroup) {
                      const isOpen = !!openGroups[item.name]
                      const hasActiveChild = item.children.some((c) =>
                        isRouteActive(pathname, c.href, allNavHrefs)
                      )

                      return (
                        <div key={item.name} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => toggleGroup(item.name)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                toggleGroup(item.name)
                              }
                            }}
                            aria-expanded={isOpen}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group text-left",
                              hasActiveChild
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/75"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <item.icon
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                                  hasActiveChild ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )}
                              />
                              <span className="truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={cn(
                                  "text-[10px] px-1.5 py-0.2 rounded-md font-mono transition-colors",
                                  hasActiveChild
                                    ? "bg-primary/20 text-primary font-bold"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {item.children.length}
                              </span>
                              {isOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200" />
                              )}
                            </div>
                          </button>

                          {/* Nested Child Items */}
                          {isOpen && (
                            <div className="ml-3 pl-2.5 border-l-2 border-border/60 space-y-1 pt-0.5">
                              {item.children.map((child) => {
                                const isChildActive = isRouteActive(pathname, child.href, allNavHrefs)
                                return (
                                  <NavLink
                                    key={child.name}
                                    href={child.href}
                                    id={child.name}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative group",
                                      isChildActive
                                        ? "bg-primary/15 text-primary font-bold shadow-xs border-l-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/75 hover:translate-x-0.5"
                                    )}
                                  >
                                    <child.icon
                                      className={cn(
                                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                                        isChildActive && "text-primary font-bold"
                                      )}
                                    />
                                    <span className="truncate">{child.name}</span>
                                  </NavLink>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }

                    // 2. Standard Flat Nav Link
                    const isActive = isRouteActive(pathname, item.href, allNavHrefs)
                    return (
                      <NavLink
                        key={item.name}
                        href={item.href}
                        id={item.name}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 relative group",
                          isActive
                            ? "bg-primary/15 text-primary font-bold border-l-2 border-primary shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/75 hover:translate-x-0.5"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                            isActive && "text-primary"
                          )}
                        />
                        <span className="truncate">{item.name}</span>
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
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
