"use client"

import { useState, useEffect } from "react"
import { NavLink } from "@/components/nav-link"
import { usePathname } from "next/navigation"
import { cn, isRouteActive } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notification-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenterDrawer } from "@/components/notification-center-drawer"
import {
  HardHat,
  LayoutDashboard,
  Clock,
  Briefcase,
  Package,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
  Megaphone,
  LogOut,
  Menu,
  X,
  Cpu,
  BookOpen,
  Award,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Radio,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react"

export interface NavLeafItem {
  name: string
  href: string
  icon: any
  badge?: string | number
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
    title: "Daily Operations",
    items: [
      { name: "Dashboard", href: "/employee", icon: LayoutDashboard },
      { name: "My Tasks & Jobs", href: "/employee/jobs", icon: Briefcase },
      { name: "Time Tracking & Shift", href: "/employee/time-tracking", icon: Clock },
    ],
  },
  {
    title: "CNC Field Service",
    items: [
      {
        name: "Service Operations",
        icon: Cpu,
        isGroup: true,
        children: [
          { name: "Machine Registry", href: "/employee/machines", icon: Cpu },
          { name: "SOPs & Manuals", href: "/employee/knowledge-base", icon: BookOpen },
        ],
      },
    ],
  },
  {
    title: "HR & Self-Service",
    items: [
      { name: "HR Hub & Leaves", href: "/employee/hr-hub", icon: Megaphone },
      { name: "My Payroll", href: "/employee/payroll", icon: DollarSign },
      { name: "Skill Passport", href: "/employee/skills", icon: Award },
    ],
  },
  {
    title: "Supplies & Comms",
    items: [
      { name: "Materials & Supplies", href: "/employee/materials", icon: Package },
      { name: "Messages & Alerts", href: "/employee/messages", icon: MessageSquare },
      { name: "Performance Reports", href: "/employee/reports", icon: BarChart3 },
      { name: "Settings & Security", href: "/employee/settings", icon: Settings },
    ],
  },
]

// Flatten all hrefs for active route resolution
const allHrefs = navCategories.flatMap((cat) =>
  cat.items.flatMap((item) => (item.isGroup ? item.children.map((c) => c.href) : [item.href]))
)

export function EmployeeSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Service Operations": true,
  })

  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { getUnreadCount } = useNotifications()
  const unreadCount = getUnreadCount()

  // Auto-expand groups if child route is active
  useEffect(() => {
    navCategories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.isGroup) {
          const hasActiveChild = item.children.some((c) => pathname.startsWith(c.href))
          if (hasActiveChild) {
            setOpenGroups((prev) => ({ ...prev, [item.name]: true }))
          }
        }
      })
    })
  }, [pathname])

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card/95 backdrop-blur-md border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col h-full",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        {/* Logo and Brand Header */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between shrink-0 bg-background/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 ring-1 ring-white/20 shrink-0">
              <HardHat className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-foreground">SmartERP</h1>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  STAFF
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                {user?.company_name || "Enterprise Portal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationCenterDrawer />
            <ThemeToggle compact />
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {navCategories.map((category) => (
            <div key={category.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/70 mb-1.5 select-none">
                {category.title}
              </h3>
              {category.items.map((item) => {
                if (item.isGroup) {
                  const isGroupOpen = !!openGroups[item.name]
                  const hasActiveChild = item.children.some((c) => isRouteActive(pathname, c.href, allHrefs))

                  return (
                    <div key={item.name} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.name)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group text-left select-none",
                          hasActiveChild
                            ? "bg-muted/70 text-foreground font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              hasActiveChild ? "text-amber-500" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isGroupOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        )}
                      </button>

                      {isGroupOpen && (
                        <div className="pl-3.5 ml-2.5 border-l border-border/60 space-y-0.5 mt-0.5">
                          {item.children.map((child) => {
                            const isChildActive = isRouteActive(pathname, child.href, allHrefs)
                            return (
                              <NavLink
                                key={child.name}
                                href={child.href}
                                id={child.name}
                                className={cn(
                                  "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group relative",
                                  isChildActive
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border-l-2 border-amber-500 pl-2 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <child.icon
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-105",
                                      isChildActive ? "text-amber-500" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                  />
                                  <span className="truncate">{child.name}</span>
                                </div>
                              </NavLink>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                // Leaf Items
                const isActive = isRouteActive(pathname, item.href, allHrefs)
                const isMsg = item.name.includes("Messages")
                return (
                  <NavLink
                    key={item.name}
                    href={item.href}
                    id={item.name}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group relative select-none",
                      isActive
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border-l-2 border-amber-500 shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:translate-x-0.5"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                          isActive ? "text-amber-500" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {isMsg && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[1.25rem] text-center shadow-xs animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-3 border-t border-border/80 shrink-0 bg-background/50">
          <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || "E"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user?.name || "Employee"}</p>
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  {user?.position || user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[11px] font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-3 w-3 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  )
}
