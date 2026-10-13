"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

import {
  Building2, Users, Clock, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Calendar, Loader2, Briefcase,
  RefreshCw, Zap, ArrowRight, FileText, Package, UserCheck,
  Radio, ShoppingBag, Navigation
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateTimeWeather } from "@/components/date-time-weather"
import { DashboardTrialBanner } from "@/components/dashboard-trial-banner"
import { SubscriptionStatus } from "@/components/subscription-status"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList, SkeletonCard } from "@/components/ui/skeleton-card"

import { apiClient } from "@/lib/apiClient"
import { useAuth } from "@/contexts/auth-context"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import { ApprovalCenter } from "@/components/approval-center"
import { ActivityTimeline } from "@/components/activity-timeline"
import { AuditLogsTable } from "@/components/audit-logs-table"
import { ExecutiveAnalyticsDashboard } from "@/components/executive-analytics-dashboard"
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
    case "completed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "in_progress":
    case "active":
    case "accepted": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "open": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }
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
        apiClient("/api/dashboard/owner/metrics"),
        apiClient("/api/dashboard/owner/recent-activity"),
        apiClient("/api/work-requests?status=pending").catch(() => ({ requests: [] })),
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
        message: err.message || "We couldn't synchronize your business metrics. Please check your network."
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) fetchDashboardData()
  }, [fetchDashboardData, authLoading])

  const activeJobs = metrics?.activeJobs ?? 0
  const totalEmployees = metrics?.activeEmployees ?? 0
  const todayAttendance = metrics?.todayAttendance ?? 0
  const budgetUtil = parseFloat(metrics?.budgetUtilization ?? "0")
  const totalBudget = metrics?.totalBudget ?? 0
  const totalSpent = metrics?.totalSpent ?? 0

  const quickActions = [
    { label: "Create Job", icon: Briefcase, href: "/owner/jobs" },
    { label: "CNC Command Center", icon: Radio, href: "/owner/cnc/command-center" },
    { label: "SLA Engine", icon: Clock, href: "/owner/cnc/sla" },
    { label: "Spare Part POs", icon: ShoppingBag, href: "/owner/cnc/vendors" },
    { label: "Dispatch Routes", icon: Navigation, href: "/owner/cnc/route-optimization" },
    { label: "Add Employee", icon: Users, href: "/owner/employees" },
    { label: "Process Payroll", icon: DollarSign, href: "/owner/payroll" },
    { label: "View Reports", icon: Calendar, href: "/owner/reports" },
  ]

  if (loading && !metrics) {
    return (
      <OwnerLayout>
        <div className="space-y-10 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-10 w-64 bg-muted/20 rounded-lg" />
              <div className="h-4 w-96 bg-muted/10 rounded-lg" />
            </div>
            <div className="h-10 w-48 bg-muted/20 rounded-lg" />
          </div>
          <SkeletonList count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonCard className="h-100" />
            <SkeletonCard className="h-100" />
          </div>
        </div>
      </OwnerLayout>
    )
  }

  if (error && !metrics) {
    return (
      <OwnerLayout>
        <div className="max-w-2xl mx-auto py-20">
          <ErrorView 
            title={error.title} 
            message={error.message} 
            onRetry={fetchDashboardData} 
          />
        </div>
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard Overview
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Welcome back! Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <Button variant="outline" size="icon" onClick={fetchDashboardData} title="Refresh" className="shrink-0 h-9 w-9 rounded-lg">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <DateTimeWeather />
          </div>
        </div>

        <SubscriptionStatus />

        {/* Proactive AI Business Operating Intelligence Banner */}
        <ProactiveAIInsights />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Active Jobs", value: activeJobs, sub: "Revenue generating",
              icon: Building2, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20"
            },
            {
              label: "Total Employees", value: totalEmployees, sub: "Workforce strength",
              icon: Users, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20"
            },
            {
              label: "Today's Attendance", value: todayAttendance, sub: "Shift completion",
              icon: Clock, color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20"
            },
            {
              label: "Budget Utilization", value: `${Number(budgetUtil || 0).toFixed(1)}%`,
              sub: `₹${Number(totalSpent || 0).toLocaleString() } utilized`,
              icon: DollarSign, color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20"
            },
          ].map((stat) => (
            <Card key={stat.label} className={cn("hover:border-primary/30 transition-all border", stat.border)}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
                    <div className={cn("text-2xl sm:text-3xl font-bold tracking-tight", stat.color)}>{stat.value}</div>
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{stat.sub}</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Executive Approval Command Center KPI Strip */}
        {pendingApprovals > 0 && (
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-950/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span className="text-sm font-black text-indigo-900 dark:text-indigo-200">Executive Approval Center</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                  {pendingApprovals} pending
                </span>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded-xl"
                onClick={() => router.push("/owner/jobs?view=approvals")}
              >
                Open Approval Center <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Employee Field Requests", count: approvalCounts.employee, icon: UserCheck, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950/50", href: "/owner/jobs?view=approvals&category=jobs" },
                { label: "Customer Requests", count: approvalCounts.customer, icon: Users, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-950/50", href: "/owner/jobs?view=approvals&category=customers" },
                { label: "Invoice & Finance", count: approvalCounts.invoice, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/50", href: "/owner/jobs?view=approvals&category=finance" },
                { label: "Inventory & Materials", count: approvalCounts.inventory, icon: Package, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/50", href: "/owner/jobs?view=approvals&category=inventory" },
              ].map((kpi) => (
                <button
                  key={kpi.label}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-background border border-border/60 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer text-left"
                  onClick={() => router.push(kpi.href)}
                >
                  <div className={cn("p-2 rounded-lg shrink-0", kpi.bg)}>
                    <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-black text-foreground leading-none">{kpi.count}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-tight">{kpi.label}</div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto shrink-0 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Operational Focus: Active Projects & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Active Projects */}
          <Card className="border border-border/70 shadow-xs flex flex-col">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  Active Projects
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => router.push("/owner/jobs")}>
                  View All Jobs <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <CardDescription className="text-xs">Jobs currently in progress or accepted</CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex-1 space-y-3">
              {Array.isArray(metrics?.activeProjects) && metrics.activeProjects.length > 0 ? (
                metrics.activeProjects.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer space-y-2"
                    onClick={() => router.push("/owner/jobs")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">{job.title || "Untitled Project"}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0", statusColor(job.employee_status !== 'pending' ? job.employee_status : job.status))}>
                        {job.employee_status !== 'pending' ? job.employee_status : job.status}
                      </span>
                    </div>
                    <Progress value={Number(job.progress || 0)} className="h-1.5" />
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>{Number(job.progress || 0)}% completed</span>
                      <span className={cn("capitalize px-1.5 py-0.2 rounded font-semibold text-[10px]", statusColor(job.priority))}>
                        {job.priority || "medium"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                  <Briefcase className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No active projects</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">All jobs are currently completed or closed.</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs h-8 rounded-xl" onClick={() => router.push("/owner/jobs")}>
                    Create a Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Operational Activity */}
          <Card className="border border-border/70 shadow-xs flex flex-col">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Recent Operational Activity
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => router.push("/owner/messages")}>
                  View Alerts <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <CardDescription className="text-xs">Latest business updates and audit notifications</CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex-1 space-y-2.5">
              {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
                recentActivity.slice(0, 6).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {activity.priority === "high" || activity.type === "alert" ? (
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{activity.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{activity.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0 font-medium whitespace-nowrap">
                      {new Date(activity.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No recent activity</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Your operational stream is up to date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Controls / Quick Workflows */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight uppercase text-muted-foreground">Quick System Workflows</h2>
            <span className="text-xs text-muted-foreground">Direct module access</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="p-3 flex items-center gap-3 rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30 active:scale-[0.99] transition-all text-left group cursor-pointer shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight truncate">{label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
