"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NavLink } from "@/components/nav-link"
import { ModernThemeToggle } from "@/components/modern-theme-toggle"
import {
  LayoutDashboard,
  Clock,
  Briefcase,
  Package,
  DollarSign,
  MessageSquare,
  Bell,
  Settings,
  Warehouse,
} from "lucide-react"
import { ClockWeatherWidget } from "@/components/clock-weather-widget"

const navigation = [
  { name: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { name: "My Jobs", href: "/employee/jobs", icon: Briefcase },
  { name: "Time Tracking", href: "/employee/time", icon: Clock },
  { name: "Inventory", href: "/employee/inventory", icon: Warehouse },
  { name: "Material Requests", href: "/employee/materials", icon: Package },
  { name: "Payroll", href: "/employee/payroll", icon: DollarSign },
  { name: "Messages", href: "/employee/messages", icon: MessageSquare },
  { name: "Notifications", href: "/employee/notifications", icon: Bell },
  { name: "Settings", href: "/employee/settings", icon: Settings },
]

export function EmployeeTopNav() {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <NavLink
                key={item.name}
                href={item.href}
                id={item.name}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </NavLink>
            )
          })}
        </div>

        <div className="ml-auto pl-4 flex items-center gap-3">
          <ClockWeatherWidget />
          <ModernThemeToggle />
        </div>
      </div>
    </div>
  )
}
