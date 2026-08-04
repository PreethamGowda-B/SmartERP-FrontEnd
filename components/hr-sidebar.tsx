"use client"

import { useState, useEffect } from "react"
import { NavLink } from "@/components/nav-link"
import { apiClient } from "@/lib/apiClient"
import { usePathname } from "next/navigation"
import { cn, isRouteActive } from "@/lib/utils"
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
  UserPlus,
  Calendar,
  Award,
  TrendingUp,
  GraduationCap,
  Laptop,
  Inbox,
  ShieldCheck,
  HeartPulse
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { logger } from "@/lib/logger"

const navigation = [
  { name: "Operations Dashboard", href: "/hr", icon: LayoutDashboard },
  { name: "Employee Directory", href: "/hr/employees", icon: Users },
  { name: "Recruitment (ATS)", href: "/hr/recruitment", icon: UserPlus },
  { name: "Attendance & GPS", href: "/hr/attendance", icon: Clock },
  { name: "Shift & Roster", href: "/hr/roster", icon: Calendar },
  { name: "Leave & Holidays", href: "/hr/leave", icon: ShieldCheck },
  { name: "Payroll & Benefits", href: "/hr/payroll", icon: DollarSign },
  { name: "Skills & Certifications", href: "/hr/skills", icon: Award },
  { name: "Performance (PMS)", href: "/hr/performance", icon: TrendingUp },
  { name: "Training & Safety", href: "/hr/training", icon: GraduationCap },
  { name: "Asset Management", href: "/hr/assets", icon: Laptop },
  { name: "Document Vault", href: "/hr/documents", icon: Files },
  { name: "Request Inbox", href: "/hr/requests", icon: Inbox },
  { name: "Exit Offboarding", href: "/hr/exit", icon: LogOut },
  { name: "Announcements & Hub", href: "/hr/hr-hub", icon: Megaphone },
  { name: "Customer Jobs", href: "/hr/customer-jobs", icon: UserCheck },
  { name: "Messages", href: "/hr/messages", icon: MessageSquare },
]

const hrNavHrefs = navigation.map((n) => n.href)

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
        <div className="p-4 border-b border-sidebar-border/80 flex items-center justify-between shrink-0 bg-sidebar/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 shadow-xs">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-foreground">SmartERP</h1>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                HR Portal
              </span>
            </div>
          </div>
          <ThemeToggle compact />
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {navigation.filter((item) => {
            if (item.name === "Messages" && !features.messages) return false
            if (item.name === "Payroll" && !features.payroll) return false
            if (item.name === "Contact Support" && !features.priority_support) return false
            return true
          }).map((item) => {
            const isActive = isRouteActive(pathname, item.href, hrNavHrefs)
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

        {/* Footer - user info */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <div className="p-3 rounded-xl bg-sidebar-accent/40 border border-sidebar-border/60 backdrop-blur-xs">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "H"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user?.name || "HR Manager"}</p>
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

