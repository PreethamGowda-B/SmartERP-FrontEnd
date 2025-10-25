"use client"

import { useState } from "react"
import { NavLink } from "@/components/nav-link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  HardHat,
  LayoutDashboard,
  Clock,
  Briefcase,
  Package,
  DollarSign,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { name: "My Jobs", href: "/employee/jobs", icon: Briefcase },
  { name: "Time Tracking", href: "/employee/time", icon: Clock },
  { name: "Material Requests", href: "/employee/materials", icon: Package },
  { name: "Payroll", href: "/employee/payroll", icon: DollarSign },
  { name: "Messages", href: "/employee/messages", icon: MessageSquare },
  { name: "Notifications", href: "/employee/notifications", icon: Bell },
  { name: "Settings", href: "/employee/settings", icon: Settings },
]

export function EmployeeSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
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
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b border-border">
            <div className="p-2 bg-accent rounded-lg">
              <HardHat className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">SmartERP</h1>
              <p className="text-sm text-muted-foreground">Employee Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <NavLink
                  key={item.name}
                  href={item.href}
                  id={item.name}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              )
            })}
          </nav>

          {/* User info and sign out */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-accent-foreground">{user?.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.position}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
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
