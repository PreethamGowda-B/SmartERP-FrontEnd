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
  Clock,
  DollarSign,
  Bell,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Headset,
  Megaphone,
  Files,
  Briefcase,
  UserCheck,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { logger } from "@/lib/logger"

const navigation = [
  { name: "Dashboard", href: "/hr", icon: LayoutDashboard },
  { name: "Tasks", href: "/hr/tasks", icon: Briefcase },
  { name: "Customer Jobs", href: "/hr/customer-jobs", icon: UserCheck },
  { name: "Employees", href: "/hr/employees", icon: Users },
  { name: "Attendance", href: "/hr/attendance", icon: Clock },
  { name: "Documents", href: "/hr/documents", icon: Files },
  { name: "Payroll", href: "/hr/payroll", icon: DollarSign },
  { name: "HR Hub", href: "/hr/hr-hub", icon: Megaphone },
  { name: "Messages", href: "/hr/messages", icon: MessageSquare },
  { name: "Notifications", href: "/hr/notifications", icon: Bell },
  { name: "Contact Support", href: "/hr/support", icon: Headset },
]

export function HRSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [features, setFeatures] = useState<Record<string, boolean>>({
    payroll: false,
    messages: false,
    priority_support: false
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
        if (res && res.plan && res.plan.features) {
          setFeatures(res.plan.features)
        }
      } catch (err) {
        logger.error("HR Sidebar failed to fetch plan status:", err)
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
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SmartERP</h1>
              <p className="text-sm text-muted-foreground">HR Portal</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {navigation.filter((item) => {
            if (item.name === "Messages" && !features.messages) return false
            if (item.name === "Payroll" && !features.payroll) return false
            if (item.name === "Contact Support" && !features.priority_support) return false
            return true
          }).map((item) => {
            const isActive = pathname === item.href
            return (
              <NavLink
                key={item.name}
                href={item.href}
                id={item.name}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
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

