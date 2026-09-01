"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  PieChart as PieChartIcon,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  AlertCircle
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
  Cell,
  Legend
} from 'recharts'
import { useAuth } from "@/contexts/auth-context"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
  activeUsers30d: number
  companyGrowthMoM: number
  userGrowthMoM: number
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

const TIER_COLORS: Record<string, string> = {
  Free: "#94A3B8",
  Basic: "#3B82F6",
  Pro: "#6366F1",
  Enterprise: "#8B5CF6",
  Other: "#CBD5E1"
}

const PIE_PALETTE = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#94A3B8"]

function safeDistance(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Recently"
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const pathname = usePathname()
  const [data, setData] = useState<DashboardData | null>(null)
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartView, setChartView] = useState<'companies' | 'users'>('companies')

  const pathParts = pathname.split('/')
  const baseSegment = pathParts[1] || "superadmin"

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    setError(null)
    try {
      const [res, healthRes] = await Promise.all([
        apiClient<DashboardData>("/api/admin/dashboard"),
        apiClient("/api/admin/health").catch(() => null)
      ])
      setData(res)
      setHealth(healthRes)
    } catch (err: any) {
      logger.error("Failed to fetch admin stats:", err)
      setError(err?.message || "Failed to load dashboard metrics.")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== "super_admin") return

    fetchDashboardData()

    // Listen for custom global refresh events triggered from AdminTopNav
    const handleGlobalRefresh = () => fetchDashboardData(true)
    window.addEventListener("smarterp:admin:refresh", handleGlobalRefresh)
    return () => window.removeEventListener("smarterp:admin:refresh", handleGlobalRefresh)
  }, [user?.id, user?.role, authLoading, fetchDashboardData])

  const stats = data?.stats
  const activeChartData = chartView === 'companies' 
    ? (data?.charts?.companyGrowth || []) 
    : (data?.charts?.userGrowth || [])

  const pieData = (data?.charts?.subscriptionDistribution || []).map((item, idx) => ({
    ...item,
    color: TIER_COLORS[item.name] || PIE_PALETTE[idx % PIE_PALETTE.length]
  }))

  const totalSubsInPie = pieData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans pb-12">
        {/* ── Page Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Platform Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Real-time health, tenant growth, and activity metrics across the SmartERP ecosystem
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
              <span>Refresh Metrics</span>
            </Button>
            <Link href={`/${baseSegment}/analytics`}>
              <Button
                size="sm"
                className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 shadow-sm shadow-indigo-600/20"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Revenue BI</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => fetchDashboardData(true)} className="h-7 text-xs text-rose-700 hover:bg-rose-100">
              Retry
            </Button>
          </div>
        )}

        {/* ── Primary KPI Grid (4 Cards) ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Companies */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Companies</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {loading ? "..." : (stats?.totalCompanies ?? 0).toLocaleString()}
              </span>
              {stats?.companyGrowthMoM !== undefined && (
                <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  stats.companyGrowthMoM >= 0 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {stats.companyGrowthMoM >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {Math.abs(stats.companyGrowthMoM)}% MoM
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Multi-tenant active organizations</span>
            </p>
          </div>

          {/* Card 2: Total Users */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {loading ? "..." : (stats?.totalUsers ?? 0).toLocaleString()}
              </span>
              {stats?.userGrowthMoM !== undefined && (
                <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  stats.userGrowthMoM >= 0 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {stats.userGrowthMoM >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {Math.abs(stats.userGrowthMoM)}% MoM
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Staff, owners & customer logins</span>
            </p>
          </div>

          {/* Card 3: Active Subscriptions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Subscriptions</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {loading ? "..." : (stats?.activeSubscriptions ?? 0).toLocaleString()}
              </span>
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold px-2 py-0.5">
                Paid Tiers
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span className="font-semibold text-slate-700">{stats?.trialUsers ?? 0}</span> trial accounts active
            </p>
          </div>

          {/* Card 4: 30d Retention */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">30d Retention</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {loading ? "..." : (stats?.activeUsers30d ?? 0).toLocaleString()}
              </span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                Active
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span className="font-semibold text-slate-700">{stats?.recentActivity24h ?? 0}</span> events logged in 24h
            </p>
          </div>
        </div>

        {/* ── Interactive Visualizations Grid (2 Columns) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Growth Area Chart (2/3 width) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Registration Velocity (Last 30 Days)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daily volume of platform registrations</p>
              </div>

              {/* Toggle: Company vs User growth */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
                <button
                  onClick={() => setChartView('companies')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartView === 'companies'
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Companies
                </button>
                <button
                  onClick={() => setChartView('users')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartView === 'users'
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Users
                </button>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              {loading ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" />
              ) : activeChartData.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Activity className="h-6 w-6 mb-2 opacity-50" />
                  <span>No registration data recorded in the last 30 days.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartView === 'companies' ? "#4F46E5" : "#3B82F6"} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={chartView === 'companies' ? "#4F46E5" : "#3B82F6"} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
                      dy={8}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px', 
                        border: '1px solid #E2E8F0', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                      labelStyle={{ color: '#64748B', fontWeight: 500, marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={chartView === 'companies' ? "#4F46E5" : "#3B82F6"} 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#areaGradient)" 
                      name={chartView === 'companies' ? "New Companies" : "New Users"}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Subscription Tier Distribution Donut Chart (1/3 width) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Tier Distribution</h2>
                <PieChartIcon className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Active organizations by subscription plan</p>
            </div>

            <div className="h-[200px] w-full relative flex items-center justify-center">
              {loading ? (
                <div className="w-36 h-36 rounded-full bg-slate-50 animate-pulse" />
              ) : pieData.length === 0 ? (
                <p className="text-xs text-slate-400">No active tiers</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          borderRadius: '10px', 
                          border: '1px solid #E2E8F0',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Metric */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                      {totalSubsInPie}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tenants</span>
                  </div>
                </>
              )}
            </div>

            {/* Legend breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {item.value} ({totalSubsInPie > 0 ? Math.round((Number(item.value) / totalSubsInPie) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Real-Time System Activity Feed ─────────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live System Activity Stream
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Most recent user actions across all companies</p>
            </div>
            <Link href={`/${baseSegment}/logs`}>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1">
                <span>View Full Audit Trail</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">User / Actor</th>
                  <th className="pb-3">Action Description</th>
                  <th className="pb-3">Organization</th>
                  <th className="pb-3 text-right pr-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 pl-2"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                      <td className="py-3.5"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                      <td className="py-3.5"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                      <td className="py-3.5 pr-2 text-right"><div className="h-4 w-20 bg-slate-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : !data?.pulse || data.pulse.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No recent activity signals recorded.
                    </td>
                  </tr>
                ) : (
                  data.pulse.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pl-2 font-semibold text-slate-800">
                        {item.user_name || "System Automated"}
                      </td>
                      <td className="py-3">
                        <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-mono font-medium">
                          {item.action}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {item.company_name || "Platform-wide"}
                      </td>
                      <td className="py-3 pr-2 text-right text-slate-400 font-mono text-[11px]">
                        {safeDistance(item.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
