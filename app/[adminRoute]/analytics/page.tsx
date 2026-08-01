"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion } from "framer-motion"
import {
  TrendingUp, DollarSign, Users, Building2, ArrowUpRight,
  Crown, Zap, Globe, RefreshCw, Calendar, Target,
  ChevronUp, ChevronDown, Activity, AlertTriangle
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"
import { formatDistanceToNow } from "date-fns"

interface RevenueData {
  mrr: number
  arr: number
  planBreakdown: Array<{ plan: string; count: number; price: number; revenue: number }>
  recentUpgrades: Array<{ company_name: string; plan_name: string; updated_at: string }>
  churned: number
  monthlyTrend: Array<{ month: string; basicRevenue: number; proRevenue: number; total: number }>
}

const PLAN_COLORS: Record<string, string> = {
  "Free": "#94a3b8",
  "Basic": "#3b82f6",
  "Pro": "#a855f7",
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

export default function AnalyticsPage() {
  const [dashData, setDashData] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dash, revenue] = await Promise.all([
        apiClient("/api/admin/dashboard"),
        apiClient("/api/admin/revenue"),
      ])
      setDashData(dash)
      setRevenueData(revenue)
    } catch (err) {
      toast.error("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const KPICard = ({ label, value, sub, icon: Icon, color, trend }: any) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {Math.abs(trend)}% MoM
        </div>
      )}
    </div>
  )

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Platform Analytics</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">
              Revenue, growth & platform intelligence
            </p>
          </div>
          <Button
            variant="outline"
            className="h-10 rounded-xl font-black text-xs uppercase tracking-widest gap-2"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Revenue KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Monthly Recurring Revenue"
            value={loading ? "—" : formatINR(revenueData?.mrr || 0)}
            sub={loading ? "" : `ARR: ${formatINR((revenueData?.arr || 0))}`}
            icon={TrendingUp}
            color="bg-gradient-to-br from-emerald-500 to-green-600"
            trend={dashData?.stats?.companyGrowthMoM}
          />
          <KPICard
            label="Total Companies"
            value={loading ? "—" : dashData?.stats?.totalCompanies || 0}
            sub={`+${dashData?.stats?.companyGrowthMoM || 0}% this month`}
            icon={Building2}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <KPICard
            label="Active Subscriptions"
            value={loading ? "—" : dashData?.stats?.activeSubscriptions || 0}
            sub="Paid plans"
            icon={Crown}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <KPICard
            label="Churned"
            value={loading ? "—" : revenueData?.churned || 0}
            sub="Expired subscriptions"
            icon={AlertTriangle}
            color="bg-gradient-to-br from-amber-500 to-orange-500"
          />
        </div>

        {/* Plan Breakdown + Monthly Revenue Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Distribution Pie */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" /> Plan Distribution
            </h2>
            {loading ? (
              <div className="h-48 bg-slate-50 animate-pulse rounded-2xl" />
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueData?.planBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="plan"
                    >
                      {revenueData?.planBreakdown?.map((entry) => (
                        <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v} companies`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Plan breakdown list */}
            <div className="mt-4 space-y-3">
              {(revenueData?.planBreakdown || []).map((p) => (
                <div key={p.plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[p.plan] || "#94a3b8" }} />
                    <span className="text-sm font-bold text-slate-700">{p.plan}</span>
                    <span className="text-xs text-slate-400">{p.count} cos</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{formatINR(p.revenue)}/mo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" /> Revenue Trend (6 months)
            </h2>
            {loading ? (
              <div className="h-48 bg-slate-50 animate-pulse rounded-2xl" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData?.monthlyTrend || []}>
                    <defs>
                      <linearGradient id="colorBasic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      formatter={(v: any) => [formatINR(v), ""]}
                    />
                    <Area type="monotone" dataKey="basicRevenue" name="Basic" stroke="#3b82f6" strokeWidth={2} fill="url(#colorBasic)" />
                    <Area type="monotone" dataKey="proRevenue" name="Pro" stroke="#a855f7" strokeWidth={2} fill="url(#colorPro)" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Company & User Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" /> Company Adoption (30d)
            </h2>
            <div className="h-52">
              {loading ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashData?.charts?.companyGrowth || []}>
                    <defs>
                      <linearGradient id="colorCo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                    <Area type="stepAfter" dataKey="count" name="New Companies" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorCo)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" /> User Expansion (30d)
            </h2>
            <div className="h-52">
              {loading ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashData?.charts?.userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="count" name="New Users" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Recent Upgrades */}
        {(revenueData?.recentUpgrades?.length || 0) > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" /> Recent Plan Upgrades
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {revenueData?.recentUpgrades?.map((u, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Crown className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{u.company_name}</p>
                    <p className="text-xs text-slate-400">→ {u.plan_name} • {formatDistanceToNow(new Date(u.updated_at))} ago</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
