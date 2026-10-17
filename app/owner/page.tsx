"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Building2,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Briefcase,
  RefreshCw,
  Zap,
  ArrowRight,
  FileText,
  Package,
  UserCheck,
  Radio,
  ShoppingBag,
  Navigation,
  User,
  Sparkles,
  Activity,
  ChevronRight,
  Bell,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Filter,
  Search,
} from "lucide-react"
import { SubscriptionStatus } from "@/components/subscription-status"
import { ErrorView } from "@/components/ui/error-view"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { apiClient } from "@/lib/apiClient"
import { useAuth } from "@/contexts/auth-context"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import { ProactiveAIInsights } from "@/components/proactive-ai-insights"

type DashboardMetrics = {
  activeJobs: number
  activeEmployees: number
  todayAttendance: number
  budgetUtilization: string
  totalBudget: number
  totalSpent: number
  activeProjects: any[]
}

type RecentActivity = {
  id: string | number
  type: string
  title: string
  message: string
  priority: string
  created_at: string
}

function statusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    case "in_progress":
    case "active":
    case "accepted":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
    case "open":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
    default:
      return "bg-muted text-muted-foreground border-border/60"
  }
}

function priorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case "high":
    case "critical":
    case "urgent":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold"
    case "medium":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold"
    case "low":
    default:
      return "bg-secondary text-muted-foreground border-border/50 font-medium"
  }
}

function formatActivityTime(dateStr: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const now = new Date()
  const isToday = now.toDateString() === date.toDateString()
  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = yesterday.toDateString() === date.toDateString()
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  if (isToday) return `Today, ${timeStr}`
  if (isYesterday) return `Yesterday, ${timeStr}`
  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${timeStr}`
}

export default function OwnerDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [attentionItems, setAttentionItems] = useState<any[]>([])
  const [projectFilter, setProjectFilter] = useState<"all" | "in_progress" | "high_priority">("all")
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  useEffect(() => {
    const updateClock = () => setCurrentTime(new Date())
    updateClock()
    const interval = window.setInterval(updateClock, 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      const [metricsData, activityData, approvalData] = await Promise.all([
        apiClient<DashboardMetrics>("/api/dashboard/owner/metrics"),
        apiClient<RecentActivity[]>("/api/dashboard/owner/recent-activity"),
        apiClient<{ requests?: any[] }>("/api/work-requests?status=pending").catch(() => ({ requests: [] })),
      ])
      setMetrics(metricsData)
      setRecentActivity(Array.isArray(activityData) ? activityData : [])
      setLastSyncedAt(new Date())
      const workRequests = approvalData?.requests || []
      setPendingApprovals(workRequests.length)
      setAttentionItems(workRequests.slice(0, 3))
    } catch (err: any) {
      logger.error("Error fetching dashboard data:", err)
      setError({
        title: "Dashboard update failed",
        message: err.message || "We couldn't synchronize your business metrics. Check your connection.",
      })
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) fetchDashboardData()
  }, [fetchDashboardData, authLoading])

  useEffect(() => {
    if (authLoading) return
    const refreshForOperationalChange = (event: Event) => {
      const detail = (event as CustomEvent<any>).detail
      if (!detail?.type || ["job", "chat_message", "material_request", "invoice", "invoice_issued", "attendance"].includes(String(detail.type).toLowerCase())) {
        void fetchDashboardData(false)
      }
    }
    window.addEventListener("smarterp:notification", refreshForOperationalChange)
    const fallback = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchDashboardData(false)
    }, 60_000)
    return () => {
      window.removeEventListener("smarterp:notification", refreshForOperationalChange)
      window.clearInterval(fallback)
    }
  }, [authLoading, fetchDashboardData])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await fetchDashboardData(false)
    setIsRefreshing(false)
  }

  const activeJobs = metrics?.activeJobs ?? 0
  const totalEmployees = metrics?.activeEmployees ?? 0
  const todayAttendance = metrics?.todayAttendance ?? 0
  const budgetUtil = parseFloat(metrics?.budgetUtilization ?? "0")
  const totalBudget = metrics?.totalBudget ?? 0
  const totalSpent = metrics?.totalSpent ?? 0

  const attendancePct = totalEmployees > 0 ? Math.round((todayAttendance / totalEmployees) * 100) : 0

  const deduplicatedActivity = useMemo(() => {
    if (!Array.isArray(recentActivity)) return []
    const seen = new Set<string>()
    return recentActivity
      .filter((item) => {
        const key = `${(item.title || "").trim().toLowerCase()}:${(item.message || "").trim().toLowerCase()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 5)
  }, [recentActivity])

  const filteredProjects = useMemo(() => {
    if (!Array.isArray(metrics?.activeProjects)) return []
    if (projectFilter === "in_progress") {
      return metrics.activeProjects.filter((p) =>
        ["in_progress", "active", "accepted"].includes((p.employee_status || p.status || "").toLowerCase())
      )
    }
    if (projectFilter === "high_priority") {
      return metrics.activeProjects.filter((p) => (p.priority || "").toLowerCase() === "high")
    }
    return metrics.activeProjects
  }, [metrics?.activeProjects, projectFilter])

  // Preserved Quick Actions
  const quickActions = [
    {
      label: "Create Job",
      desc: "Dispatch new work order",
      icon: Briefcase,
      href: "/owner/jobs",
      gradient: "from-blue-600 to-indigo-600",
    },
    {
      label: "CNC Command Center",
      desc: "Machine telemetry & health",
      icon: Radio,
      href: "/owner/cnc/command-center",
      gradient: "from-violet-600 to-purple-600",
    },
    {
      label: "SLA Engine",
      desc: "Service benchmarks",
      icon: Clock,
      href: "/owner/cnc/sla",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      label: "Spare Part POs",
      desc: "Supplier orders & stock",
      icon: ShoppingBag,
      href: "/owner/cnc/vendors",
      gradient: "from-amber-600 to-orange-600",
    },
    {
      label: "Dispatch Routes",
      desc: "Route optimization",
      icon: Navigation,
      href: "/owner/cnc/route-optimization",
      gradient: "from-teal-600 to-emerald-600",
    },
    {
      label: "Add Employee",
      desc: "Roster & permissions",
      icon: Users,
      href: "/owner/employees",
      gradient: "from-emerald-600 to-green-600",
    },
    {
      label: "Process Payroll",
      desc: "Wages & attendance audit",
      icon: DollarSign,
      href: "/owner/payroll",
      gradient: "from-rose-600 to-red-600",
    },
    {
      label: "View Reports",
      desc: "Analytics & export data",
      icon: FileText,
      href: "/owner/reports",
      gradient: "from-sky-600 to-blue-600",
    },
  ]

  if (loading && !metrics) {
    return (
      <OwnerLayout>
        <div className="space-y-6 animate-pulse max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          <div className="h-24 bg-muted/40 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted/40 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkeletonCard className="h-80" />
            <SkeletonCard className="h-80" />
          </div>
        </div>
      </OwnerLayout>
    )
  }

  if (error && !metrics) {
    return (
      <OwnerLayout>
        <div className="max-w-2xl mx-auto py-16 px-4">
          <ErrorView title={error.title} message={error.message} onRetry={() => fetchDashboardData(true)} />
        </div>
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout>
      <div className="mx-auto max-w-[1700px] space-y-4 p-3 sm:p-5 xl:p-6">
        {/* Dashboard-only search launcher. The portal sidebar is intentionally unchanged. */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("smarterp:open-search"))}
            className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border/70 bg-card px-4 text-left text-sm text-muted-foreground shadow-xs transition hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Search jobs, employees, and customers"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">Search jobs, employees, customers...</span>
            <kbd className="ml-auto hidden rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
          </button>
          <div className="hidden shrink-0 items-center gap-2 text-muted-foreground sm:flex">
            <button type="button" onClick={() => router.push("/owner/messages")} aria-label="Open messages and alerts" title="Messages and alerts" className="rounded-lg border border-border/70 bg-card p-2 transition hover:bg-muted"><Bell className="h-4 w-4" /></button>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-xs font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">{(user?.name || "O").slice(0, 1).toUpperCase()}</span>
            <span className="max-w-[150px] truncate text-xs font-medium text-foreground">{user?.name || "Owner"}</span>
          </div>
        </div>

        {/* Executive welcome banner */}
        <section className="relative isolate overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 p-4 shadow-xs dark:border-sky-900/50 dark:from-emerald-950/30 dark:via-cyan-950/25 dark:to-blue-950/30 sm:p-5 xl:p-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-20 opacity-50">
            <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="h-full w-full text-sky-200 dark:text-sky-900/60">
              <path d="M0 105 130 74l95 26 113-61 120 52 115-72 139 69 98-37 125 54 117-63 148 49v49H0Z" fill="currentColor" opacity=".45" />
              <path d="M0 124 141 91l109 27 131-49 116 36 105-45 120 38 121-33 129 39 109-45 119 31v50H0Z" fill="currentColor" opacity=".55" />
            </svg>
          </div>
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-blue-200 bg-white/70 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:border-blue-800 dark:bg-slate-950/40 dark:text-blue-300">Executive Suite</Badge>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Operations overview
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Welcome back, {user?.name ? user.name.split(" ")[0] : "Owner"} <span aria-hidden="true">👋</span>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Here&apos;s what&apos;s happening with your operations today.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 xl:gap-5">
              <div className="min-w-[130px]">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white"><Clock className="h-4 w-4 text-blue-700 dark:text-blue-300" /><span className="font-mono text-lg font-bold tabular-nums">{currentTime?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) || "--:--"}</span></div>
                <div className="mt-0.5 pl-6 text-[11px] text-slate-600 dark:text-slate-300">{currentTime?.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) || "Loading date"}</div>
              </div>
              <div className="hidden h-9 w-px bg-slate-300/70 dark:bg-slate-700 sm:block" />
              <div className="text-xs text-slate-600 dark:text-slate-300"><span className="block font-semibold text-slate-900 dark:text-white">SmartERP</span><span>{lastSyncedAt ? `Updated ${lastSyncedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}` : "Operations overview"}</span></div>
              <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing} className="h-10 gap-2 rounded-xl border-white/80 bg-white/80 text-xs font-semibold text-slate-900 shadow-xs hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:hover:bg-slate-900">
                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                <span>{isRefreshing ? "Syncing" : "Sync Data"}</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Subscription and inventory callouts */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:items-stretch">
          <div className="min-w-0 xl:col-span-8"><SubscriptionStatus /></div>
          <div className="min-w-0 xl:col-span-4 [&>div]:h-full [&>div>div]:h-full"><ProactiveAIInsights /></div>
        </div>

        {/* ─── C. Advanced Executive KPI Cards ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {/* 1. Active Jobs */}
          <Card
            onClick={() => router.push("/owner/jobs")}
            className="rounded-2xl border border-slate-200/80 bg-card shadow-[0_3px_12px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md cursor-pointer group dark:border-slate-800"
          >
            <CardContent className="min-h-[112px] p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Active Jobs</span>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                  {activeJobs}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {activeJobs === 0 ? "No active work orders" : "In progress & accepted"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Total Workforce */}
          <Card
            onClick={() => router.push("/owner/employees")}
            className="rounded-2xl border border-slate-200/80 bg-card shadow-[0_3px_12px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md cursor-pointer group dark:border-slate-800"
          >
            <CardContent className="min-h-[112px] p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Employees</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Users className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                  {totalEmployees}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {totalEmployees === 0 ? "No employees added" : "Registered employees"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Today's Attendance */}
          <Card
            onClick={() => router.push("/owner/attendance")}
            className="rounded-2xl border border-slate-200/80 bg-card shadow-[0_3px_12px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md cursor-pointer group dark:border-slate-800"
          >
            <CardContent className="min-h-[112px] p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Today&apos;s Attendance</span>
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform relative">
                  <Clock className="h-4 w-4" />
                  {todayAttendance > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums flex items-baseline gap-2">
                  <span>{todayAttendance}</span>
                  {totalEmployees > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground font-sans">
                      / {totalEmployees}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {totalEmployees > 0
                    ? `${todayAttendance} of ${totalEmployees} present (${attendancePct}%)`
                    : "No employees added"}
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <span>Coverage Rate</span>
                  <span className="font-mono">{attendancePct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-600 transition-all duration-500"
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Budget Utilization (Handles zero budget cap accurately) */}
          <Card
            onClick={() => router.push("/owner/finance")}
            className="rounded-2xl border border-slate-200/80 bg-card shadow-[0_3px_12px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md cursor-pointer group dark:border-slate-800"
          >
            <CardContent className="min-h-[112px] p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Budget Utilization</span>
                <div className={cn(
                  "p-2.5 rounded-xl group-hover:scale-105 transition-transform",
                  budgetUtil > 85 ? "bg-rose-500/10 text-rose-600" : budgetUtil > 70 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                )}>
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                  {totalBudget > 0 ? (
                    `${Number(budgetUtil || 0).toFixed(1)}%`
                  ) : totalSpent > 0 ? (
                    `₹${(totalSpent / 1000).toFixed(1)}k`
                  ) : (
                    "No Cap"
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {totalBudget > 0
                    ? `₹${Number(totalSpent || 0).toLocaleString("en-IN")} of ₹${Number(totalBudget).toLocaleString("en-IN")}`
                    : totalSpent > 0
                    ? `₹${Number(totalSpent || 0).toLocaleString("en-IN")} total spent`
                    : "No budget cap configured"}
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <span>{totalBudget > 0 ? "Utilized" : "Cap State"}</span>
                  <span className="font-mono">
                    {totalBudget > 0 ? `${Math.min(Math.round(budgetUtil), 100)}%` : totalSpent > 0 ? "Uncapped" : "N/A"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      budgetUtil > 85 ? "bg-rose-600" : budgetUtil > 70 ? "bg-amber-600" : "bg-emerald-600"
                    )}
                    style={{ width: `${totalBudget > 0 ? Math.min(budgetUtil, 100) : totalSpent > 0 ? 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {pendingApprovals > 0 && (
          <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><AlertTriangle className="h-4 w-4" /></span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Needs your attention <span className="ml-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] text-amber-900 dark:bg-amber-900 dark:text-amber-100">{pendingApprovals}</span></p>
                <p className="truncate text-xs text-muted-foreground">{attentionItems.map((item) => item.title).filter(Boolean).join(' · ') || 'Requests are waiting for review'}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-9 shrink-0 gap-2 rounded-lg border-amber-300 bg-white/70 text-xs font-semibold text-amber-900 hover:bg-white dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100" onClick={() => router.push('/owner/jobs?view=approvals')}>
              Review requests <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </section>
        )}
        {/* ─── D. Active Projects & E. Recent Activity ──────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
          {/* D. Active Projects (7 cols) */}
          <Card className="rounded-2xl border border-border/70 shadow-xs lg:col-span-1 xl:col-span-5 flex flex-col justify-between overflow-hidden">
            <div>
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Active Projects &amp; Jobs</CardTitle>
                      <CardDescription className="text-xs">
                        Production work orders currently in progress or accepted
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Project Filter Chips */}
                    <div className="flex items-center bg-secondary/50 p-0.5 rounded-xl border border-border/60 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setProjectFilter("all")}
                        className={cn(
                          "px-2 py-1 rounded-lg font-semibold transition-colors",
                          projectFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                        )}
                      >
                        All ({metrics?.activeProjects?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectFilter("in_progress")}
                        className={cn(
                          "px-2 py-1 rounded-lg font-semibold transition-colors",
                          projectFilter === "in_progress" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                        )}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectFilter("high_priority")}
                        className={cn(
                          "px-2 py-1 rounded-lg font-semibold transition-colors",
                          projectFilter === "high_priority" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                        )}
                      >
                        High
                      </button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-primary font-bold px-2 rounded-xl"
                      onClick={() => router.push("/owner/jobs")}
                    >
                      View all <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-2.5">
                {filteredProjects.length > 0 ? (
                  filteredProjects.slice(0, 5).map((job, idx) => {
                    const statusStr = job.employee_status !== "pending" ? job.employee_status : job.status
                    return (
                      <div
                        key={job.id}
                        className="p-3.5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-secondary/20 transition-all cursor-pointer space-y-2"
                        onClick={() => router.push("/owner/jobs")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-secondary text-foreground text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                              {job.title || "Untitled Job Order"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge className={cn("text-[10px] uppercase font-bold", statusColor(statusStr))}>
                              {statusStr || "Open"}
                            </Badge>
                            {job.priority && (
                              <Badge variant="outline" className={cn("text-[9px] uppercase", priorityColor(job.priority))}>
                                {job.priority}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground/70" />
                              {job.assignee_name || "Unassigned crew"}
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {Number(job.progress || 0)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${Number(job.progress || 0)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12 border border-dashed rounded-2xl flex flex-col items-center justify-center">
                    <Briefcase className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-bold text-foreground">No active work orders</p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                      All production jobs have been completed or closed.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs h-8 rounded-xl font-semibold"
                      onClick={() => router.push("/owner/jobs")}
                    >
                      Create Work Order
                    </Button>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>

          {/* E. Recent Activity Timeline (5 cols) */}
          <Card className="rounded-2xl border border-border/70 shadow-xs lg:col-span-1 xl:col-span-4 flex flex-col justify-between overflow-hidden">
            <div>
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Recent Activity</CardTitle>
                      <CardDescription className="text-xs">
                        Operational event stream &amp; audit updates
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-primary font-bold px-2 rounded-xl"
                    onClick={() => router.push("/owner/messages")}
                  >
                    View alerts <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                {deduplicatedActivity.length > 0 ? (
                  <div className="space-y-4 relative">
                    {deduplicatedActivity.map((activity, idx) => {
                      const isAlert = activity.priority === "high" || activity.type === "alert"
                      return (
                        <div key={activity.id} className="flex items-start gap-3 relative group">
                          {/* Timeline vertical guide line */}
                          {idx < deduplicatedActivity.length - 1 && (
                            <div className="absolute left-3 top-7 bottom-[-16px] w-px bg-border/80" />
                          )}

                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 z-10",
                              isAlert
                                ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                            )}
                          >
                            {isAlert ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-foreground truncate">{activity.title}</p>
                              {isAlert && (
                                <Badge variant="outline" className="text-[9px] uppercase font-bold text-rose-600 border-rose-500/30 px-1.5 py-0">
                                  Alert
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{activity.message}</p>
                            <p className="text-[10px] text-muted-foreground/70 font-mono">
                              {formatActivityTime(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed rounded-2xl flex flex-col items-center justify-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-bold text-foreground">Operational stream clear</p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                      No critical events or system alerts in the queue.
                    </p>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        {/* ─── F. Quick Workflows — Action Launcher ──────────────────────── */}
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs lg:col-span-2 xl:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Quick Workflows &amp; Operations
              </h2>
              <p className="text-[11px] text-muted-foreground">
                One-click access to core operational consoles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map(({ label, desc, icon: Icon, href, gradient }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="group relative min-h-[108px] rounded-xl border border-border/70 bg-background p-3 text-left transition-all hover:border-primary/40 hover:bg-secondary/20 hover:shadow-sm active:scale-[0.99]"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-xs transition-transform group-hover:scale-105", gradient)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                    {label}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
        </div>

      </div>
    </OwnerLayout>
  )
}
