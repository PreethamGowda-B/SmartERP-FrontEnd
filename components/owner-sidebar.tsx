"use client"

import { useState, useEffect, useRef } from "react"
import { NavLink } from "@/components/nav-link"
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
  FileText,
  TrendingUp,
  Receipt,
  AlertCircle,
  MonitorCog,
  PieChart,
  Target,
  LifeBuoy,
  FileBarChart,
  Tag,
  Warehouse,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenterDrawer } from "@/components/notification-center-drawer"

// ─── Types ─────────────────────────────────────────────────────────────────

interface NavLeafItem {
  name: string
  href: string
  icon: React.ElementType
}

interface NavGroupItem {
  id: string           // stable key for open/closed persistence
  name: string
  icon: React.ElementType
  children: NavLeafItem[]
}

// ─── Navigation Structure ──────────────────────────────────────────────────
// 10 top-level groups, each collapsible. Dashboard is pinned above the groups.

const PINNED_NAV: NavLeafItem = {
  name: "Dashboard",
  href: "/owner",
  icon: LayoutDashboard,
}

const NAV_GROUPS: NavGroupItem[] = [
  // ── 1. Operations ─────────────────────────────────────────────────────────
  {
    id: "operations",
    name: "Operations",
    icon: Briefcase,
    children: [
      { name: "Jobs & Tasks",    href: "/owner/jobs",           icon: Briefcase   },
      { name: "Customer Jobs",   href: "/owner/customer-jobs",  icon: UserCheck   },
      { name: "Quotations",      href: "/owner/quotations",     icon: Tag         },
      { name: "Sales Pipeline",  href: "/owner/crm/pipeline",   icon: Flame       },
      { name: "Invoice Issues",  href: "/owner/invoice-issues", icon: AlertCircle },
      { name: "Live Tracking",   href: "/owner/tracking",       icon: MapPin      },
    ],
  },

  // ── 2. People Management ──────────────────────────────────────────────────
  {
    id: "people",
    name: "People Management",
    icon: Users,
    children: [
      { name: "Employees",      href: "/owner/employees",                  icon: Users       },
      { name: "Attendance",     href: "/owner/attendance",                 icon: Clock       },
      { name: "Payroll",        href: "/owner/payroll",                    icon: DollarSign  },
      { name: "Payroll Audit",  href: "/owner/payroll/pre-run-validation", icon: ShieldCheck },
      { name: "HR Hub",         href: "/owner/hr-hub",                     icon: Megaphone   },
    ],
  },

  // ── 3. Inventory & Resources ──────────────────────────────────────────────
  {
    id: "inventory",
    name: "Inventory & Resources",
    icon: Warehouse,
    children: [
      { name: "Inventory",         href: "/owner/inventory",              icon: Box        },
      { name: "Consumables",       href: "/owner/inventory/consumables",  icon: Package    },
      { name: "Demand Forecasts",  href: "/owner/inventory/forecasts",    icon: TrendingUp },
      { name: "Materials",         href: "/owner/materials",              icon: Layers     },
    ],
  },

  // ── 4. Finance ────────────────────────────────────────────────────────────
  {
    id: "finance",
    name: "Finance",
    icon: DollarSign,
    children: [
      { name: "Finance Overview",     href: "/owner/finance",                     icon: PieChart    },
      { name: "Invoices & Billing",   href: "/owner/finance/invoices",            icon: FileText    },
      { name: "Payments",             href: "/owner/finance/payments",            icon: CreditCard  },
      { name: "Accounts Receivable",  href: "/owner/finance/accounts-receivable", icon: Receipt     },
      { name: "AR Collections",       href: "/owner/ar-collections",             icon: Target      },
      { name: "GST & Tax",            href: "/owner/finance/gst",                icon: ShieldCheck },
      { name: "GST Reconciliation",   href: "/owner/finance/gst-reconciliation", icon: FileBarChart},
      { name: "Financial Reports",    href: "/owner/finance/reports",            icon: BarChart3   },
    ],
  },

  // ── 5. Machines & CNC ─────────────────────────────────────────────────────
  {
    id: "machines",
    name: "Machines & CNC",
    icon: Cpu,
    children: [
      { name: "Machine Registry",   href: "/owner/machines",               icon: Cpu        },
      { name: "Command Center",     href: "/owner/cnc/command-center",     icon: Radio      },
      { name: "SLA Management",     href: "/owner/cnc/sla",                icon: Clock      },
      { name: "Dispatch Routes",    href: "/owner/cnc/route-optimization", icon: Navigation },
      { name: "Automations",        href: "/owner/cnc/automations",        icon: Zap        },
      { name: "Supplier Warranty",  href: "/owner/cnc/warranty",           icon: Award      },
      { name: "Vendors & POs",      href: "/owner/cnc/vendors",            icon: ShoppingBag},
      { name: "CNC Reports",        href: "/owner/cnc/reports",            icon: BarChart3  },
      { name: "Executive BI",       href: "/owner/cnc/bi",                 icon: PieChart   },
      { name: "AI Audit Trail",     href: "/owner/cnc/ai-activity",        icon: Bot        },
    ],
  },

  // ── 6. Documents & Communication ──────────────────────────────────────────
  {
    id: "documents",
    name: "Documents & Comms",
    icon: Files,
    children: [
      { name: "Documents",       href: "/owner/documents",     icon: Files         },
      { name: "Messages",        href: "/owner/messages",      icon: MessageSquare },
      { name: "Notifications",   href: "/owner/notifications", icon: Bell          },
      { name: "Remote Support",  href: "/owner/remote-support",icon: MonitorCog   },
    ],
  },

  // ── 7. Reports & Analytics ────────────────────────────────────────────────
  {
    id: "reports",
    name: "Reports & Analytics",
    icon: BarChart3,
    children: [
      { name: "Business Reports",  href: "/owner/reports",         icon: BarChart3   },
      { name: "Financial Reports", href: "/owner/finance/reports", icon: FileBarChart},
      { name: "Executive BI",      href: "/owner/cnc/bi",          icon: PieChart    },
      { name: "CNC Reports",       href: "/owner/cnc/reports",     icon: BarChart3   },
    ],
  },

  // ── 8. Settings & Administration ──────────────────────────────────────────
  {
    id: "settings",
    name: "Settings & Admin",
    icon: Settings,
    children: [
      { name: "Settings",        href: "/owner/settings", icon: Settings  },
      { name: "Subscription",    href: "/owner/billing",  icon: CreditCard},
      { name: "Contact Support", href: "/owner/support",  icon: LifeBuoy  },
    ],
  },
]

// Flat list of all hrefs for isRouteActive sibling-precedence calculation
const allNavHrefs: string[] = [
  PINNED_NAV.href,
  ...NAV_GROUPS.flatMap((g) => g.children.map((c) => c.href)),
]

const STORAGE_KEY = "smarterp_owner_nav_v2"

// ─── Component ─────────────────────────────────────────────────────────────

export function OwnerSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const navRef = useRef<HTMLDivElement>(null)

  // Which groups are expanded. Default: all closed; auto-open the active one.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return JSON.parse(saved)
      } catch (_) {}
    }
    return {}
  })

  // Auto-expand the group that contains the active route
  useEffect(() => {
    for (const group of NAV_GROUPS) {
      const hasActive = group.children.some((c) =>
        isRouteActive(pathname, c.href, allNavHrefs)
      )
      if (hasActive && !openGroups[group.id]) {
        setOpenGroups((prev) => {
          const next = { ...prev, [group.id]: true }
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch (_) {}
          return next
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch (_) {}
      return next
    })
  }

  // Persist sidebar scroll position across navigations
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

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  const closeMobile = () => setIsMobileMenuOpen(false)

  // ── Sidebar inner content (shared between desktop + mobile)
  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border/80 flex items-center justify-between shrink-0 bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-black tracking-tight text-foreground truncate">SmartERP</h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 w-fit">
              Owner Portal
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <NotificationCenterDrawer />
          <ThemeToggle compact />
        </div>
      </div>

      {/* Scrollable nav */}
      <div
        ref={navRef}
        onScroll={handleNavScroll}
        className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {/* Pinned Dashboard */}
        {(() => {
          const isDashActive = pathname === PINNED_NAV.href || pathname === "/owner/"
          return (
            <NavLink
              href={PINNED_NAV.href}
              id="Dashboard"
              onClick={closeMobile}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group mb-2",
                isDashActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70 hover:translate-x-0.5"
              )}
            >
              <PINNED_NAV.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isDashActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="truncate">{PINNED_NAV.name}</span>
            </NavLink>
          )
        })()}

        {/* Section separator */}
        <div className="mx-3 h-px bg-border/60 mb-2" />

        {/* Collapsible Groups */}
        {NAV_GROUPS.map((group) => {
          const isOpen = !!openGroups[group.id]
          const hasActiveChild = group.children.some((c) =>
            isRouteActive(pathname, c.href, allNavHrefs)
          )

          return (
            <div key={group.id} className="space-y-0.5">
              {/* Group header button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group text-left",
                  hasActiveChild
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <group.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-110",
                      hasActiveChild
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate">{group.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {hasActiveChild && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 opacity-60" />
                    : <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 opacity-60" />
                  }
                </div>
              </button>

              {/* Children */}
              {isOpen && (
                <div className="ml-3 pl-3 border-l border-border/50 space-y-0.5 py-0.5">
                  {group.children.map((child) => {
                    const isChildActive = isRouteActive(pathname, child.href, allNavHrefs)
                    return (
                      <NavLink
                        key={`${group.id}-${child.href}`}
                        href={child.href}
                        id={`${group.id}-${child.name}`}
                        onClick={closeMobile}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 group",
                          isChildActive
                            ? "bg-primary/12 text-primary font-semibold border-l-2 border-primary -ml-px pl-[9px]"
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 hover:translate-x-0.5"
                        )}
                      >
                        <child.icon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                            isChildActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "O"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{user?.name || "Owner"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors gap-1.5"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur border-b px-4 flex items-center justify-between shadow-sm">
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

      {/* Desktop Sidebar */}
      <aside
        aria-label="Owner navigation sidebar"
        className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex-col shadow-sm"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (slide in) */}
      <aside
        aria-label="Owner navigation menu"
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col shadow-lg transform transition-transform duration-250 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
    </>
  )
}
