"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import {
  Building2, Users, Clock, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Calendar, Briefcase,
  RefreshCw, Zap, ArrowRight, FileText, Package, UserCheck,
  Radio, ShoppingBag, Navigation, User, Sparkles, Activity,
  ChevronRight, Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
    case "completed":   return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
    case "in_progress":
    case "active":
    case "accepted":    return "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
    case "open":        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
    default:            return "bg-muted text-muted-foreground ring-1 ring-border"
  }
}

function formatActivityTime(dateStr: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const now = new Date()
  const isToday = now.toDateString() === date.toDateString()
  const yesterday = new Date(); yesterday.setDate(now.getDate() - 1)
  const isYesterday = yesterday.toDateString() === date.toDateString()
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  if (isToday) return `Today, ${timeStr}`
  if (isYesterday) return `Yesterday, ${timeStr}`
  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${timeStr}`
}

export default function OwnerDashboard() {
  const router = useRouter()
  const { isLoading: authLoading } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [approvalCounts, setApprovalCounts] = useState({ employee: 0, customer: 0, invoice: 0, inventory: 0 })

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
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
        invoice:  workRequests.filter((r: any) => r.category === "finance").length,
        inventory: workRequests.filter((r: any) => r.category === "inventory").length,
      })
    } catch (err: any) {
      logger.error("Error fetching dashboard data:", err)
      setError({ title: "Dashboard update failed", message: err.message || "We couldn't synchronize your business metrics." })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) fetchDashboardData()
  }, [fetchDashboardData, authLoading])

  const activeJobs      = metrics?.activeJobs ?? 0
  const totalEmployees  = metrics?.activeEmployees ?? 0
  const todayAttendance = metrics?.todayAttendance ?? 0
  const budgetUtil      = parseFloat(metrics?.budgetUtilization ?? "0")
  const totalBudget     = metrics?.totalBudget ?? 0
  const totalSpent      = metrics?.totalSpent ?? 0

  const deduplicatedActivity = useMemo(() => {
    if (!Array.isArray(recentActivity)) return []
    const seen = new Set<string>()
    return recentActivity.filter((item) => {
      const key = `${(item.title || "").trim().toLowerCase()}:${(item.message || "").trim().toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 5)
  }, [recentActivity])

  const quickActions = [
    { label: "Create Job",          icon: Briefcase,  href: "/owner/jobs",                        gradient: "from-blue-500 to-blue-700" },
    { label: "CNC Command Center",  icon: Radio,       href: "/owner/cnc/command-center",          gradient: "from-violet-500 to-indigo-700" },
    { label: "SLA Engine",          icon: Clock,       href: "/owner/cnc/sla",                     gradient: "from-purple-500 to-purple-700" },
    { label: "Spare Part POs",      icon: ShoppingBag, href: "/owner/cnc/vendors",                 gradient: "from-orange-500 to-amber-600" },
    { label: "Dispatch Routes",     icon: Navigation,  href: "/owner/cnc/route-optimization",      gradient: "from-teal-500 to-emerald-600" },
    { label: "Add Employee",        icon: Users,       href: "/owner/employees",                   gradient: "from-emerald-500 to-green-700" },
    { label: "Process Payroll",     icon: DollarSign,  href: "/owner/payroll",                     gradient: "from-rose-500 to-pink-700" },
    { label: "View Reports",        icon: Calendar,    href: "/owner/reports",                     gradient: "from-sky-500 to-cyan-600" },
  ]

  if (loading && !metrics) {
    return (
      <OwnerLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-muted/40 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted/40 rounded-2xl" />)}
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
        <div className="max-w-2xl mx-auto py-16">
          <ErrorView title={error.title} message={error.message} onRetry={fetchDashboardData} />
        </div>
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout>
      <div className="space-y-5">

        {/* ── Premium Hero Header ───────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-linear-to-br from-primary/8 via-background to-violet-500/5">
          {/* subtle decorative glow orbs */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-violet-500/10 blur-2xl" />

          <div className="relative px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                  Dashboard Overview
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Welcome back! Here is what is happening with your operations today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchDashboardData}
                title="Refresh"
                className="shrink-0 h-8 w-8 rounded-lg border-border/60 bg-background/80 backdrop-blur-sm"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
              <DateTimeWeather />
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <SubscriptionStatus />

        {/* Proactive AI Insights */}
        <ProactiveAIInsights />

        {/* ── Key Metric Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "Active Jobs",
              value: activeJobs,
              sub: activeJobs === 0 ? "No open jobs" : `${activeJobs} in-progress & open`,
              icon: Briefcase,
              gradient: "from-blue-500 to-blue-700",
              ring: "ring-blue-500/20",
              glow: "shadow-blue-500/15",
              bar: "bg-blue-500",
              pct: Math.min(activeJobs * 10, 100),
            },
            {
              label: "Total Employees",
              value: totalEmployees,
              sub: totalEmployees === 0 ? "No staff registered" : `${totalEmployees} registered crew`,
              icon: Users,
              gradient: "from-emerald-500 to-emerald-700",
              ring: "ring-emerald-500/20",
              glow: "shadow-emerald-500/15",
              bar: "bg-emerald-500",
              pct: Math.min(totalEmployees * 5, 100),
            },
            {
              label: "Today's Attendance",
              value: todayAttendance,
              sub: totalEmployees > 0
                ? (todayAttendance === 0 ? `0 of ${totalEmployees} clocked in` : `${todayAttendance} of ${totalEmployees} present`)
                : "No employees added",
              icon: Clock,
              gradient: "from-violet-500 to-indigo-700",
              ring: "ring-violet-500/20",
              glow: "shadow-violet-500/15",
              bar: "bg-violet-500",
              pct: totalEmployees > 0 ? Math.round((todayAttendance / totalEmployees) * 100) : 0,
            },
            {
              label: "Budget Utilization",
              value: `${Number(budgetUtil || 0).toFixed(1)}%`,
              sub: totalBudget > 0
                ? `₹${Number(totalSpent || 0).toLocaleString()} of ₹${Number(totalBudget).toLocaleString()}`
                : totalSpent > 0
                ? `₹${Number(totalSpent || 0).toLocaleString()} spent`
                : "No budget cap set",
              icon: DollarSign,
              gradient: budgetUtil > 80 ? "from-rose-500 to-rose-700" : "from-amber-500 to-orange-600",
              ring: budgetUtil > 80 ? "ring-rose-500/20" : "ring-amber-500/20",
              glow: budgetUtil > 80 ? "shadow-rose-500/15" : "shadow-amber-500/15",
              bar: budgetUtil > 80 ? "bg-rose-500" : "bg-amber-500",
              pct: Math.min(budgetUtil, 100),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "group relative rounded-2xl border bg-card overflow-hidden shadow-sm ring-1 hover:shadow-md transition-all duration-300",
                stat.ring, stat.glow
              )}
            >
              {/* card glow layer */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-br from-white/5 to-transparent" />

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{stat.label}</p>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5 text-foreground">{stat.value}</div>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate leading-tight">{stat.sub}</p>
                  </div>
                  <div className={cn("w-10 h-10 rounded-xl bg-linear-to-br flex items-center justify-center shadow-lg shrink-0", stat.gradient)}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* mini progress bar */}
                <div className="mt-3 h-1 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", stat.bar)}
                    style={{ width: `${stat.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Executive Approval Command Center ────────────────────────── */}
        {pendingApprovals > 0 && (
          <div className="relative rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-linear-to-br from-indigo-50/80 via-background to-purple-50/40 dark:from-indigo-950/30 dark:via-background dark:to-purple-950/20 overflow-hidden shadow-sm">
            <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-400/10 blur-2xl" />

            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-foreground">Executive Approval Center</p>
                    <p className="text-[10px] text-muted-foreground">Requires your immediate attention</p>
                  </div>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-sm shadow-rose-500/40">
                    {pendingApprovals} pending
                  </span>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded-xl shadow-sm shadow-indigo-500/30"
                  onClick={() => router.push("/owner/jobs?view=approvals")}
                >
                  Review All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: "Employee Requests", count: approvalCounts.employee,  icon: UserCheck, gradient: "from-purple-500 to-purple-700", href: "/owner/jobs?view=approvals&category=jobs" },
                  { label: "Customer Inquiries", count: approvalCounts.customer, icon: Users,     gradient: "from-sky-500 to-blue-600",     href: "/owner/jobs?view=approvals&category=customers" },
                  { label: "Invoice & Finance",  count: approvalCounts.invoice,  icon: FileText,  gradient: "from-emerald-500 to-teal-600", href: "/owner/jobs?view=approvals&category=finance" },
                  { label: "Material Requests",  count: approvalCounts.inventory,icon: Package,   gradient: "from-amber-500 to-orange-600", href: "/owner/jobs?view=approvals&category=inventory" },
                ].map((kpi) => (
                  <button
                    key={kpi.label}
                    onClick={() => router.push(kpi.href)}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-background/80 backdrop-blur-sm border border-border/60 hover:border-indigo-400/60 hover:shadow-sm transition-all text-left"
                  >
                    <div className={cn("w-8 h-8 rounded-lg bg-linear-to-br flex items-center justify-center shrink-0 shadow-sm", kpi.gradient)}>
                      <kpi.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-black text-foreground leading-none">{kpi.count}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-tight truncate">{kpi.label}</div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 ml-auto group-hover:text-indigo-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Active Projects & Recent Activity ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Active Projects */}
          <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-500/30">
                  <Building2 className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Active Projects</p>
                  <p className="text-[10px] text-muted-foreground">Jobs in progress or accepted</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold px-2" onClick={() => router.push("/owner/jobs")}>
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="p-3 flex-1 space-y-2">
              {Array.isArray(metrics?.activeProjects) && metrics.activeProjects.length > 0 ? (
                metrics.activeProjects.slice(0, 5).map((job, idx) => (
                  <div
                    key={job.id}
                    className="group p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/20 transition-all cursor-pointer"
                    onClick={() => router.push("/owner/jobs")}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                          {idx + 1}
                        </div>
                        <span className="font-semibold text-xs text-foreground truncate">{job.title || "Untitled Job"}</span>
                      </div>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0", statusColor(job.employee_status !== "pending" ? job.employee_status : job.status))}>
                        {job.employee_status !== "pending" ? job.employee_status : job.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-bold text-foreground">{Number(job.progress || 0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-primary to-violet-500 transition-all duration-700"
                          style={{ width: `${Number(job.progress || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-2.5 w-2.5 shrink-0" />
                        {job.assignee_name ? job.assignee_name : "Unassigned"}
                      </span>
                      <span className={cn("capitalize px-1.5 py-0.5 rounded font-semibold text-[9px]", statusColor(job.priority))}>
                        {job.priority || "medium"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                    <Briefcase className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs font-bold text-foreground">No active projects</p>
                  <p className="text-[11px] text-muted-foreground mt-1">All jobs are currently completed or closed.</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs h-7 rounded-xl" onClick={() => router.push("/owner/jobs")}>
                    Create a Job
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Operational Activity */}
          <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-sm shadow-violet-500/30">
                  <Activity className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Recent Activity</p>
                  <p className="text-[10px] text-muted-foreground">Operational updates & audit stream</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold px-2" onClick={() => router.push("/owner/messages")}>
                View alerts <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="p-3 flex-1">
              {deduplicatedActivity.length > 0 ? (
                <div className="space-y-0.5">
                  {deduplicatedActivity.map((activity, idx) => {
                    const isAlert = activity.priority === "high" || activity.type === "alert"
                    return (
                      <div
                        key={activity.id}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors relative"
                      >
                        {/* timeline line */}
                        {idx < deduplicatedActivity.length - 1 && (
                          <div className="absolute left-5.5 top-8 bottom-0 w-px bg-border/60" />
                        )}

                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-2 ring-background",
                          isAlert ? "bg-rose-500" : "bg-emerald-500"
                        )}>
                          {isAlert
                            ? <AlertTriangle className="h-2.5 w-2.5 text-white" />
                            : <CheckCircle className="h-2.5 w-2.5 text-white" />
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{activity.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{activity.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 font-medium mt-1">{formatActivityTime(activity.created_at)}</p>
                        </div>

                        {isAlert && (
                          <span className="shrink-0 mt-0.5 text-[9px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                            Alert
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs font-bold text-foreground">No recent activity</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Your operational stream is up to date.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick System Workflows ───────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black tracking-widest uppercase text-muted-foreground">Quick Workflows</h2>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">Direct module access</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {quickActions.map(({ label, icon: Icon, href, gradient }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="group relative h-14 px-3.5 flex items-center gap-3 rounded-2xl border border-border/70 bg-card hover:border-primary/30 hover:bg-muted/20 active:scale-[0.98] transition-all shadow-xs overflow-hidden text-left cursor-pointer"
              >
                {/* hover glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-br from-white/3 to-transparent" />

                <div className={cn("w-8 h-8 rounded-xl bg-linear-to-br flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:scale-110 duration-300", gradient)}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight truncate">{label}</p>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/60 ml-auto shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </OwnerLayout>
  )
}
