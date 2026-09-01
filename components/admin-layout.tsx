"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldCheck, 
  ShieldAlert,
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  Megaphone, 
  MessageSquare,
  BarChart3, 
  Settings,
  LogOut,
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
    { name: "Security Center", icon: ShieldAlert, href: "/security" },
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <ShieldCheck className="h-12 w-12 text-slate-900 animate-pulse mb-4" />
        <p className="text-slate-600 font-semibold tracking-tight">Verifying Platform Security...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans light">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-30 flex flex-col bg-white text-slate-900 shadow-xl transition-all duration-300 ease-in-out border-r border-slate-200"
      >
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 overflow-hidden"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white border border-slate-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-extrabold text-sm tracking-tight whitespace-nowrap text-slate-900">Control Center</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Super Admin
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-8 h-8 rounded-xl bg-slate-900 text-white border border-slate-800 flex items-center justify-center mx-auto"
              >
                <ShieldCheck className="h-5 w-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const fullHref = `${secretPrefix}${item.href}`
            const isActive = isRouteActive(pathname, fullHref, menuItems.map(m => `${secretPrefix}${m.href}`))
            
            return (
              <Link key={item.name} href={fullHref}>
                <div className={cn(
                  "relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-xs font-semibold",
                  isActive 
                    ? "bg-slate-900 text-white shadow-sm font-bold" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:translate-x-0.5"
                )}>
                  <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900")} />
                  {isSidebarOpen && (
                    <span className="whitespace-nowrap text-xs tracking-tight">{item.name}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 shrink-0 bg-slate-50/50">
           <div className={cn("p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3", !isSidebarOpen && "justify-center")}>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                <Users className="h-4 w-4 text-white" />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate text-slate-900">{user.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Super Admin</span>
                </div>
              )}
           </div>
           <Button 
             variant="ghost" 
             onClick={signOut}
             className={cn("w-full justify-start gap-3 mt-2 text-slate-600 hover:text-red-600 hover:bg-red-50 h-8 px-3 text-xs transition-colors font-semibold", !isSidebarOpen && "justify-center")}
           >
             <LogOut className="h-4 w-4" />
             {isSidebarOpen && <span className="text-xs font-bold">Logout</span>}
           </Button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-200 hover:bg-slate-100 hover:scale-110 transition-all z-40"
        >
          {isSidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-200 flex flex-col bg-slate-50 text-slate-900">
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-xs">
           <div className="flex items-center gap-4">
             <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em]">SmartERP Platform Control Center</h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Systems Operational</span>
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
