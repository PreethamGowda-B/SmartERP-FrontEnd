"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  Megaphone, 
  MessageSquare,
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Brain,
  ScrollText,
  Server
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import { cn, isRouteActive } from "@/lib/utils"


interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, isLoading } = useAuth()

  // Strict check: Redirect if not super_admin (after loading)
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'super_admin')) {
      logger.warn("🚫 Access denied: Not a superadmin")
      router.push("/superadmin/login")
    }
  }, [user?.id, user?.role, isLoading, router])

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "" },
    { name: "Companies", icon: Building2, href: "/companies" },
    { name: "Users", icon: Users, href: "/users" },
    { name: "Subscriptions", icon: CreditCard, href: "/billing" },
    { name: "Announcements", icon: Megaphone, href: "/announcements" },
    { name: "Feedback", icon: MessageSquare, href: "/feedback" },
    { name: "AI Operations", icon: Brain, href: "/ai-operations" },
    { name: "Analytics", icon: BarChart3, href: "/analytics" },
    { name: "System Logs", icon: ScrollText, href: "/logs" },
    { name: "Settings & Maintenance", icon: Settings, href: "/settings" },
  ]

  // Get route prefix from current pathname (/superadmin or legacy secret slug)
  const pathParts = pathname.split('/')
  const baseSegment = pathParts[1] || "superadmin"
  const secretPrefix = `/${baseSegment}`

  if (isLoading || !user || user.role !== 'super_admin') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <ShieldCheck className="h-12 w-12 text-slate-900 animate-pulse mb-4" />
        <p className="text-slate-600 font-semibold tracking-tight">Verifying Platform Security...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-30 flex flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-all duration-300 ease-in-out border-r border-sidebar-border"
      >
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/80 bg-sidebar/50 backdrop-blur-md">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 overflow-hidden"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-extrabold text-sm tracking-tight whitespace-nowrap">Control Center</h1>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Super Admin
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center mx-auto"
              >
                <ShieldCheck className="h-5 w-5 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {menuItems.map((item) => {
            const fullHref = `${secretPrefix}${item.href}`
            const isActive = isRouteActive(pathname, fullHref, menuItems.map(m => `${secretPrefix}${m.href}`))
            
            return (
              <Link key={item.name} href={fullHref}>
                <div className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-xs font-medium",
                  isActive 
                    ? "bg-primary/15 text-primary font-bold border-l-2 border-primary shadow-xs" 
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/75 hover:translate-x-0.5"
                )}>
                  <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive && "text-primary")} />
                  {isSidebarOpen && (
                    <span className="font-medium whitespace-nowrap text-xs tracking-tight">{item.name}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
           <div className={cn("p-3 rounded-xl bg-sidebar-accent/40 border border-sidebar-border/60 backdrop-blur-xs flex items-center gap-3", !isSidebarOpen && "justify-center")}>
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0 font-bold text-xs">
                <Users className="h-4 w-4 text-primary" />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate text-foreground">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Super Admin</span>
                </div>
              )}
           </div>
           <Button 
             variant="ghost" 
             onClick={signOut}
             className={cn("w-full justify-start gap-3 mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-3 text-xs transition-colors", !isSidebarOpen && "justify-center")}
           >
             <LogOut className="h-4 w-4" />
             {isSidebarOpen && <span className="font-semibold text-xs">Logout</span>}
           </Button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card text-foreground flex items-center justify-center shadow-lg border border-border hover:scale-110 transition-transform z-40"
        >
          {isSidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-muted flex flex-col">
        <header className="h-16 border-b border-border/80 flex items-center justify-between px-8 bg-card/80 backdrop-blur-md sticky top-0 z-20 shadow-xs">
           <div className="flex items-center gap-4">
             <h2 className="text-xs font-extrabold text-muted-foreground uppercase tracking-[0.2em]">SmartERP System Control</h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Systems Live</span>
              </div>
           </div>
        </header>

        <div className="p-8 pb-20 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
