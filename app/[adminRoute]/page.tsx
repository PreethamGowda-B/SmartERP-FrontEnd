"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { motion } from "framer-motion"
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"

interface StatsType {
  totalCompanies: number
  totalUsers: number
  activeSubscriptions: number
  trialUsers: number
  recentActivity24h: number
}

export default function AdminDashboard() {
  const params = useParams()
  const router = useRouter()
  const [stats, setStats] = useState<StatsType | null>(null)
  const [loading, setLoading] = useState(true)

  // Secret Route Verification
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_ROUTE || "platform-control-secret"
  const currentRoute = params.adminRoute

  useEffect(() => {
    if (currentRoute !== adminSecret) {
      router.push("/404")
      return
    }

    const fetchStats = async () => {
      try {
        const data = await apiClient("/api/admin/dashboard")
        setStats(data.stats)
      } catch (err) {
        console.error("Failed to fetch admin stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [currentRoute, adminSecret, router])

  if (currentRoute !== adminSecret) return null

  const statCards = [
    { name: "Total Companies", value: stats?.totalCompanies ?? 0, icon: Building2, color: "text-blue-500", trend: "+12%" },
    { name: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-purple-500", trend: "+5%" },
    { name: "Active Subscriptions", value: stats?.activeSubscriptions ?? 0, icon: CreditCard, color: "text-green-500", trend: "+8%" },
    { name: "Trial Users", value: stats?.trialUsers ?? 0, icon: Activity, color: "text-orange-500", trend: "-2%" },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm uppercase tracking-widest font-medium opacity-60">Real-time health of SmartERP Ecosystem</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-white/5 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5">
                    {stat.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                    <span className={stat.trend.startsWith('+') ? "text-green-500" : "text-red-500"}>{stat.trend}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{stat.name}</h3>
                  <p className="text-4xl font-bold text-white mt-1 tabular-nums">
                    {loading ? "..." : stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Placeholder for Revenue Chart/Active Users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 p-8 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md h-80 flex items-center justify-center">
             <div className="text-center">
                <TrendingUp className="h-12 w-12 text-accent mx-auto opacity-20" />
                <p className="text-muted-foreground mt-4 font-medium italic">Growth Visualization Coming Soon...</p>
             </div>
           </div>
           <div className="p-8 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md h-80 flex flex-col">
              <h3 className="text-white font-bold tracking-tight">Recent System Pulse</h3>
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="space-y-2">
                  <p className="text-5xl font-bold text-accent">{stats?.recentActivity24h ?? 0}</p>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Actions in 24h</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  )
}
