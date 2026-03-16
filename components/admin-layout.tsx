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
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"


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
      console.warn("🚫 Access denied: Not a superadmin")
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "" }, // Base of secret route
    { name: "Companies", icon: Building2, href: "/companies" },
    { name: "Users", icon: Users, href: "/users" },
    { name: "Subscriptions", icon: CreditCard, href: "/billing" },
    { name: "Announcements", icon: Megaphone, href: "/announcements" },
    { name: "Analytics", icon: BarChart3, href: "/analytics" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ]

  // Get the secret route prefix from current pathname
  const pathParts = pathname.split('/')
  const secretPrefix = `/${pathParts[1]}`

  if (isLoading || !user || user.role !== 'super_admin') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <ShieldCheck className="h-12 w-12 text-slate-900 animate-pulse mb-4" />
        <p className="text-slate-600 font-semibold tracking-tight">Verifying Platform Security...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-30 flex flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ease-in-out border-r border-slate-800"
      >
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 overflow-hidden"
              >
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-slate-900" />
                </div>
                <span className="font-bold text-lg tracking-tight whitespace-nowrap">
                  Control Center
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mx-auto"
              >
                <ShieldCheck className="h-5 w-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 py-6 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const fullHref = `${secretPrefix}${item.href}`
            const isActive = pathname === fullHref || (item.href !== "" && pathname.startsWith(fullHref))
            
            return (
              <Link key={item.name} href={fullHref}>
                <div className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? "bg-white/10 text-white" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                `}>
                  <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "group-hover:text-white transition-colors"}`} />
                  {isSidebarOpen && (
                    <span className="font-medium whitespace-nowrap text-sm tracking-tight">{item.name}</span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
           <div className={`p-3 rounded-lg bg-white/5 flex items-center gap-3 ${!isSidebarOpen && "justify-center"}`}>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-white/10">
                <Users className="h-4 w-4 text-white" />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate text-white uppercase tracking-wider">{user.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Platform Dev</span>
                </div>
              )}
           </div>
           <Button 
             variant="ghost" 
             onClick={signOut}
             className={`w-full justify-start gap-3 mt-4 text-slate-400 hover:text-red-400 hover:bg-red-400/10 h-10 px-4 transition-colors ${!isSidebarOpen && "justify-center"}`}
           >
             <LogOut className="h-5 w-5" />
             {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">Logout</span>}
           </Button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-lg border border-slate-200 hover:scale-110 transition-transform z-40"
        >
          {isSidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar flex flex-col">
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white sticky top-0 z-20 shadow-sm">
           <div className="flex items-center gap-4">
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">SmartERP System Control</h2>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">Systems Live</span>
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
