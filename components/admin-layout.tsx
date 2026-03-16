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
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { PremiumBackground } from "@/components/premium-background"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()

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
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <PremiumBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 z-10"
        >
          <ShieldCheck className="h-12 w-12 text-accent mx-auto animate-pulse" />
          <p className="text-muted-foreground font-medium italic">Verifying Platform Security...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-accent/30">
      <PremiumBackground />

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-30 flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-2xl transition-all duration-500 ease-in-out"
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between overflow-hidden">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/20">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  Control Center
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center mx-auto"
              >
                <ShieldCheck className="h-5 w-5 text-accent" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 py-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const fullHref = `${secretPrefix}${item.href}`
            const isActive = pathname === fullHref || (item.href !== "" && pathname.startsWith(fullHref))
            
            return (
              <Link key={item.name} href={fullHref}>
                <div className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? "bg-accent/10 text-accent shadow-[inset_0_0_20px_rgba(var(--accent),0.05)]" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }
                `}>
                  <item.icon className={`h-5 w-5 ${isActive ? "text-accent" : "group-hover:text-white transition-colors"}`} />
                  {isSidebarOpen && (
                    <span className="font-medium whitespace-nowrap">{item.name}</span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-accent"
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
           <div className={`p-3 rounded-xl bg-white/5 flex items-center gap-3 ${!isSidebarOpen && "justify-center"}`}>
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-accent" />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate text-white">{user.name}</span>
                  <span className="text-[10px] text-accent uppercase tracking-wider font-bold">Platform Dev</span>
                </div>
              )}
           </div>
           <Button 
             variant="ghost" 
             onClick={logout}
             className={`w-full justify-start gap-3 hover:bg-red-500/10 hover:text-red-500 transition-colors ${!isSidebarOpen && "justify-center"}`}
           >
             <LogOut className="h-5 w-5" />
             {isSidebarOpen && <span>Exit Panel</span>}
           </Button>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white shadow-lg border border-white/10 hover:scale-110 transition-transform z-40"
        >
          {isSidebarOpen ? <X className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md sticky top-0 z-20">
           <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold text-white uppercase tracking-widest opacity-40">SmartERP System Control</h2>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Systems Live</span>
              </div>
           </div>
        </header>

        <div className="p-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
