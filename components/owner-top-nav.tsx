"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ModernThemeToggle } from "@/components/modern-theme-toggle"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Clock,
  Package,
  DollarSign,
  BarChart3,
  Bell,
  Settings,
  Warehouse,
} from "lucide-react"
import { ClockWeatherWidget } from "@/components/clock-weather-widget"

const tabs = [
  { name: "Dashboard", href: "/owner", icon: LayoutDashboard },
  { name: "Jobs", href: "/owner/jobs", icon: Briefcase },
  { name: "Employees", href: "/owner/employees", icon: Users },
  { name: "Attendance", href: "/owner/attendance", icon: Clock },
  { name: "Inventory", href: "/owner/inventory", icon: Warehouse },
  { name: "Materials", href: "/owner/materials", icon: Package },
  { name: "Payroll", href: "/owner/payroll", icon: DollarSign },
  { name: "Reports", href: "/owner/reports", icon: BarChart3 },
  { name: "Notifications", href: "/owner/notifications", icon: Bell },
  { name: "Settings", href: "/owner/settings", icon: Settings },
]

export function OwnerTopNav() {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex-none ml-4 flex items-center gap-3">
          <ClockWeatherWidget />
          <ModernThemeToggle />
        </div>
      </div>
    </div>
  )
}
