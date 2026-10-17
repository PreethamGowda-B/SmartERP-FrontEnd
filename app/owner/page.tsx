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
} from "lucide-react"
import { DateTimeWeather } from "@/components/date-time-weather"
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
  const [approvalCounts, setApprovalCounts] = useState({ employee: 0, customer: 0, invoice: 0, inventory: 0 })
  const [projectFilter, setProjectFilter] = useState<"all" | "in_progress" | "high_priority">("all")

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
      const workRequests = approvalData?.requests || []
      setPendingApprovals(workRequests.length)
      setApprovalCounts({
        employee: workRequests.filter((r: any) => r.category === "jobs").length,
        customer: workRequests.filter((r: any) => r.category === "customers").length,
        invoice: workRequests.filter((r: any) => r.category === "finance").length,
        inventory: workRequests.filter((r: any) => r.category === "inventory").length,
      })
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* ─── A. Executive Welcome Header ───────────────────────────────── */}
        <div className="rounded-2xl border border-border/70 bg-card shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                EXECUTIVE SUITE
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Welcome back, {user?.name ? user.name.split(" ")[0] : "Operations Executive"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time enterprise command center. Monitor workforce readiness, active jobs, and budget allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="gap-2 rounded-xl h-9 text-xs font-semibold border-border/80"
              title="Synchronize operations data"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Sync Data</span>
            </Button>
            <DateTimeWeather />
          </div>
        </div>

        {/* ─── B. Subscription and Plan Overview ─────────────────────────── */}
        <SubscriptionStatus />

        {/* ─── Proactive Inventory Insights ──────────────────────────────── */}
        <ProactiveAIInsights />

        {/* ─── C. Advanced Executive KPI Cards ───────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* 1. Active Jobs */}
          <Card
            onClick={() => router.push("/owner/jobs")}
            className="rounded-2xl border border-border/70 bg-card shadow-xs hover:border-blue-500/40 hover:shadow-sm transition-all cursor-pointer group"
          >
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Work Orders</span>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                  {activeJobs}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {activeJobs === 0 ? "No open work orders" : `${activeJobs} in-progress & accepted`}
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <span>Capacity</span>
                  <span className="font-mono">{Math.min(activeJobs * 10, 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${Math.min(activeJobs * 10, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Total Workforce */}
          <Card
            onClick={() => router.push("/owner/employees")}
            className="rounded-2xl border border-border/70 bg-card shadow-xs hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer group"
          >
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Workforce</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Users className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                  {totalEmployees}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {totalEmployees === 0 ? "No crew members" : `${totalEmployees} registered staff`}
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <span>Roster State</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.min(totalEmployees * 5, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Today's Attendance */}
          <Card
            onClick={() => router.push("/owner/attendance")}
            className="rounded-2xl border border-border/70 bg-card shadow-xs hover:border-violet-500/40 hover:shadow-sm transition-all cursor-pointer group"
          >
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">On Shift Today</span>
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
            className="rounded-2xl border border-border/70 bg-card shadow-xs hover:border-amber-500/40 hover:shadow-sm transition-all cursor-pointer group"
          >
            <CardContent className="p-4 sm:p-5 space-y-3">
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

        {/* ─── Executive Approval Center (when pending) ──────────────────── */}
        {pendingApprovals > 0 && (
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-background to-purple-50/40 dark:from-indigo-950/20 dark:via-background dark:to-purple-950/10 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Executive Approval Center
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                      {pendingApprovals} Pending
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Operational requisitions requiring owner sign-off</p>
                </div>
              </div>

              <Button
                size="sm"
                className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                onClick={() => router.push("/owner/jobs?view=approvals")}
              >
                Review All Items <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  label: "Employee Requests",
                  count: approvalCounts.employee,
                  icon: UserCheck,
                  color: "text-purple-600 bg-purple-500/10",
                  href: "/owner/jobs?view=approvals&category=jobs",
                },
                {
                  label: "Customer Inquiries",
                  count: approvalCounts.customer,
                  icon: Users,
                  color: "text-blue-600 bg-blue-500/10",
                  href: "/owner/jobs?view=approvals&category=customers",
                },
                {
                  label: "Invoice & Finance",
                  count: approvalCounts.invoice,
                  icon: FileText,
                  color: "text-emerald-600 bg-emerald-500/10",
                  href: "/owner/jobs?view=approvals&category=finance",
                },
                {
                  label: "Material Requests",
                  count: approvalCounts.inventory,
                  icon: Package,
                  color: "text-amber-600 bg-amber-500/10",
                  href: "/owner/jobs?view=approvals&category=inventory",
                },
              ].map((kpi) => (
                <button
                  key={kpi.label}
                  onClick={() => router.push(kpi.href)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background/90 border border-border/70 hover:border-indigo-400/60 hover:shadow-xs transition-all text-left"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", kpi.color)}>
                    <kpi.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-black text-foreground font-mono tabular-nums leading-none">
                      {kpi.count}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 truncate">{kpi.label}</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── D. Active Projects & E. Recent Activity ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* D. Active Projects (7 cols) */}
          <Card className="rounded-2xl border border-border/70 shadow-xs lg:col-span-7 flex flex-col justify-between overflow-hidden">
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
          <Card className="rounded-2xl border border-border/70 shadow-xs lg:col-span-5 flex flex-col justify-between overflow-hidden">
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
        </div>

        {/* ─── F. Quick Workflows — Action Launcher ──────────────────────── */}
        <div className="space-y-3 pt-1">
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(({ label, desc, icon: Icon, href, gradient }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="group p-3.5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:bg-secondary/20 active:scale-[0.99] transition-all shadow-xs flex items-center gap-3 text-left cursor-pointer"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform",
                    gradient
                  )}
                >
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
                </div>

                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
