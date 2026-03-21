"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { motion } from "framer-motion"
import { 
  Building2, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  History,
  TrendingUp,
  Circle,
  ShieldCheck
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface ChartData {
  date: string
  count: number
}

interface DistData {
  name: string
  value: number
  [key: string]: any
}

interface PulseData {
  id: number
  action: string
  user_name: string
  company_name: string
  created_at: string
}

interface StatsType {
  totalCompanies: number
  totalUsers: number
  activeSubscriptions: number
  trialUsers: number
  recentActivity24h: number
}

interface DashboardData {
  stats: StatsType
  charts: {
    companyGrowth: ChartData[]
    userGrowth: ChartData[]
    subscriptionDistribution: DistData[]
  }
  pulse: PulseData[]
}

const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
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
        const res = await apiClient("/api/admin/dashboard")
        setData(res)
      } catch (err) {
        logger.error("Failed to fetch admin stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [currentRoute, adminSecret, router])

  if (currentRoute !== adminSecret) return null

  const stats = data?.stats
  const statCards = [
    { name: "Total Companies", value: stats?.totalCompanies ?? 0, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { name: "Active Subscriptions", value: stats?.activeSubscriptions ?? 0, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Trial Users", value: stats?.trialUsers ?? 0, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">Real-time health of SmartERP Ecosystem</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-slate-50 text-slate-500 uppercase tracking-wider border border-slate-100">
                  Live
                </div>
              </div>
              <div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.name}</h3>
                <p className="text-3xl font-black text-slate-900 tabular-nums">
                  {loading ? "..." : stat.value.toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Growth Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Platform Growth</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Company Registrations (Last 30 Days)</p>
              </div>
              <TrendingUp className="h-5 w-5 text-slate-300" />
            </div>
            
            <div className="h-[300px] w-full mt-4">
              {loading ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.charts?.companyGrowth || []}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Subscription Distribution */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Plan Mix</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-8">Subscription Tiers</p>
            
            <div className="flex-1 min-h-[250px] relative">
              {loading ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.charts?.subscriptionDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data?.charts?.subscriptionDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-2 mt-4">
              {data?.charts.subscriptionDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-bold text-slate-600 uppercase tracking-wider">{entry.name}</span>
                  </div>
                  <span className="font-black text-slate-900">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: Activity Pulse */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h3 className="text-lg font-black text-slate-900">System Activity Pulse</h3>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Real-time actions across the platform</p>
                </div>
                <History className="h-5 w-5 text-slate-300" />
              </div>
              <div className="divide-y divide-slate-50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="p-4 bg-slate-50/50 animate-pulse h-16" />
                  ))
                ) : (data?.pulse || []).map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                      <Circle className="h-3 w-3 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className="text-sm font-bold text-slate-900 truncate">
                         {item.user_name} <span className="text-slate-400 font-medium">performed</span> {item.action}
                       </p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                         {item.company_name} • {new Date(item.created_at).toLocaleTimeString()}
                       </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-200 group-hover:text-slate-900 transition-colors" />
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-slate-900 rounded-3xl p-8 flex flex-col relative overflow-hidden text-white shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="h-32 w-32" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tighter mb-1">Platform Summary</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-12">Snapshot of the last 24h</p>
                
                <div className="space-y-8">
                   <div>
                      <p className="text-5xl font-black tracking-tight">{stats?.recentActivity24h ?? 0}</p>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Actions in 24h</p>
                   </div>
                   <div className="h-px bg-white/10 w-full" />
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-white/60">System Health</span>
                         <span className="text-xs font-black text-emerald-400">OPTIMAL</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-white/60">Active Sessions</span>
                         <span className="text-xs font-black text-blue-400">{stats?.totalUsers ?? 0}</span>
                      </div>
                   </div>
                </div>
              </div>
              <div className="mt-auto pt-8 border-t border-white/5">
                <button className="w-full py-3 rounded-xl bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                  System Settings
                </button>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  )
}
