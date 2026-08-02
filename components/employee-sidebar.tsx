"use client"

import { useState, useEffect } from "react"
import { NavLink } from "@/components/nav-link"
import { usePathname } from "next/navigation"
import { cn, isRouteActive } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notification-context"
import { apiClient } from "@/lib/apiClient"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenterDrawer } from "@/components/notification-center-drawer"
import { logger } from "@/lib/logger"
import {
  HardHat,
  LayoutDashboard,
  Clock,
  Briefcase,
  Package,
  Package2,
  DollarSign,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  Megaphone,
  LogOut,
  Menu,
  X,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { name: "My Tasks", href: "/employee/jobs", icon: Briefcase },
  { name: "Time Tracking", href: "/employee/time-tracking", icon: Clock },
  { name: "Material Requests", href: "/employee/materials", icon: Package },
  { name: "Inventory", href: "/employee/inventory", icon: Package2 },
  { name: "Payroll", href: "/employee/payroll", icon: DollarSign },
  { name: "Messages", href: "/employee/messages", icon: MessageSquare },
  { name: "Notifications", href: "/employee/notifications", icon: Bell },
  { name: "Reports", href: "/employee/reports", icon: BarChart3 },
  { name: "Workplace", href: "/employee/hr-hub", icon: Megaphone },
  { name: "Settings", href: "/employee/settings", icon: Settings },
]

const empNavHrefs = navigation.map((n) => n.href)

export function EmployeeSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [features, setFeatures] = useState<Record<string, boolean>>({
    payroll: false,
    messages: false,
    location_tracking: false
  })
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { getUnreadCount } = useNotifications()
  const unreadCount = getUnreadCount()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await apiClient("/api/subscription/status")
        if (res && res.plan && res.plan.features) {
          setFeatures(res.plan.features)
        }
      } catch (err) {
        logger.error("Employee sidebar failed to fetch plan status:", err)
      }
    }
    fetchPlan()
  }, [])

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
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border/80 flex items-center justify-between shrink-0 bg-sidebar/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-xl border border-accent/30 shadow-xs">
                <HardHat className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-extrabold tracking-tight text-foreground">SmartERP</h1>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  Employee Portal
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <NotificationCenterDrawer />
              <ThemeToggle compact />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {navigation.filter((item) => {
              if (item.name === "Messages" && !features.messages) return false;
              if (item.name === "Payroll" && !features.payroll) return false;
              if (item.name === "Time Tracking" && !features.location_tracking) return false;
              return true;
            }).map((item) => {
              const isActive = isRouteActive(pathname, item.href, empNavHrefs)
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
                  <div className="flex items-center gap-3 flex-1">
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "text-primary")} />
                    <span>{item.name}</span>
                  </div>
                  {item.name === "Notifications" && unreadCount > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* User info and sign out */}
          <div className="p-3 border-t border-sidebar-border shrink-0">
            <div className="p-3 rounded-xl bg-sidebar-accent/40 border border-sidebar-border/60 backdrop-blur-xs">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent border border-accent/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "E"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{user?.name || "Employee"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.position || user?.email}</p>
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
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  )
}
