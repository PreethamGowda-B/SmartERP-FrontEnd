"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  ArrowUpRight,
  Crown,
  Zap,
  Globe,
  RefreshCw,
  Calendar,
  Target,
  ChevronUp,
  ChevronDown,
  Activity,
  AlertTriangle,
  Layers,
  ArrowRight
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { formatDistanceToNow } from "date-fns"
import { AdminLayout } from "@/components/admin-layout"

interface RevenueData {
  mrr: number
  arr: number
  planBreakdown: Array<{ plan: string; count: number; price: number; revenue: number }>
  recentUpgrades: Array<{ company_name: string; plan_name: string; updated_at: string }>
  churned: number
  monthlyTrend: Array<{ month: string; basicRevenue: number; proRevenue: number; total: number }>
}

const PLAN_COLORS: Record<string, string> = {
  Free: "#94A3B8",
  Basic: "#3B82F6",
  Pro: "#6366F1",
  Enterprise: "#8B5CF6",
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

function safeDistance(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Recently"
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

export default function AnalyticsPage() {
  const [dashData, setDashData] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    try {
      const [dash, revenue] = await Promise.all([
        apiClient("/api/admin/dashboard"),
        apiClient("/api/admin/revenue"),
      ])
      setDashData(dash)
      setRevenueData(revenue)
    } catch (err: any) {
      toast.error(err?.message || "Failed to load platform analytics data")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans pb-12">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Platform Analytics & Revenue BI
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Multi-tenant recurring revenue streams, subscription tiers, and adoption trajectories
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh Analytics</span>
          </Button>
        </div>

        {/* ── Revenue KPIs (4 Cards) ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* MRR */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Recurring (MRR)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {loading ? "..." : formatINR(revenueData?.mrr || 0)}
              </span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                Monthly Run
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 pt-0.5">
              ARR Run Rate: <strong className="text-slate-800 font-semibold font-mono">{loading ? "..." : formatINR(revenueData?.arr || 0)}</strong>
            </p>
          </div>

          {/* Total Companies */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Companies</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {loading ? "..." : (dashData?.stats?.totalCompanies ?? 0).toLocaleString()}
              </span>
              {dashData?.stats?.companyGrowthMoM !== undefined && (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold px-2 py-0.5">
                  +{dashData?.stats?.companyGrowthMoM}% MoM
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 pt-0.5">
              Across all regional tenant clusters
            </p>
          </div>

          {/* Active Paid Subscriptions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid Subscribers</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Crown className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {loading ? "..." : (dashData?.stats?.activeSubscriptions ?? 0).toLocaleString()}
              </span>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold px-2 py-0.5">
                Active Tier
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 pt-0.5">
              Contributing to recurring MRR
            </p>
          </div>

          {/* Churned */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Churned / Expired</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {loading ? "..." : (revenueData?.churned ?? 0).toLocaleString()}
              </span>
              <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-bold px-2 py-0.5">
                Lifetime
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 pt-0.5">
              Unrenewed trial or cancelled subscriptions
            </p>
          </div>
        </div>

        {/* ── Revenue Trajectory & Plan Breakdown Grid ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Trend (2/3 width) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Revenue Trajectory (Last 6 Months)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Monthly revenue contribution split by Basic & Pro tiers</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-600">Basic</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span className="text-slate-600">Pro</span>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              {loading ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" />
              ) : (revenueData?.monthlyTrend?.length || 0) === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  No monthly trend data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData?.monthlyTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBasic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }}
                      dy={8}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: "12px", 
                        border: "1px solid #E2E8F0", 
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#0F172A"
                      }}
                      formatter={(v: any) => [formatINR(Number(v)), ""]}
                    />
                    <Area type="monotone" dataKey="basicRevenue" name="Basic Plan" stroke="#3B82F6" strokeWidth={2.5} fill="url(#colorBasic)" />
                    <Area type="monotone" dataKey="proRevenue" name="Pro Plan" stroke="#6366F1" strokeWidth={2.5} fill="url(#colorPro)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Plan Breakdown & Pricing List (1/3 width) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Plan Breakdown</h2>
                <Target className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Distribution of organizations by plan tier</p>
            </div>

            <div className="h-[180px] w-full relative flex items-center justify-center">
              {loading ? (
                <div className="w-32 h-32 rounded-full bg-slate-50 animate-pulse" />
              ) : (revenueData?.planBreakdown?.length || 0) === 0 ? (
                <p className="text-xs text-slate-400">No plan data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueData?.planBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="plan"
                    >
                      {revenueData?.planBreakdown?.map((entry) => (
                        <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] || "#94A3B8"} stroke="#FFFFFF" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: "10px", 
                        border: "1px solid #E2E8F0",
                        fontSize: "11px",
                        fontWeight: 600
                      }}
                      formatter={(v: any) => [`${v} companies`, "Count"]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Plan Rows */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {(revenueData?.planBreakdown || []).map((p) => (
                <div key={p.plan} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLAN_COLORS[p.plan] || "#94A3B8" }} />
                    <span className="font-semibold text-slate-700">{p.plan}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({p.count})</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">{formatINR(p.revenue)}/mo</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Plan Upgrades Feed ───────────────────────────────────────── */}
        {(revenueData?.recentUpgrades?.length || 0) > 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Recent Tenant Plan Upgrades
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Organizations that transitioned to higher billing tiers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {revenueData?.recentUpgrades?.map((u, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{u.company_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{safeDistance(u.updated_at)}</p>
                    </div>
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold px-2 py-0.5 shrink-0">
                    {u.plan_name}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
