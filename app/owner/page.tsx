"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import {
  Building2, Users, Clock, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Calendar, Loader2, Briefcase,
  RefreshCw, Zap, ArrowRight, FileText, Package, UserCheck,
  Radio, ShoppingBag, Navigation, User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateTimeWeather } from "@/components/date-time-weather"
import { SubscriptionStatus } from "@/components/subscription-status"
import { ErrorView } from "@/components/ui/error-view"
import { SkeletonList, SkeletonCard } from "@/components/ui/skeleton-card"

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
    case "completed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "in_progress":
    case "active":
    case "accepted": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "open": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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

  // Deduplicate consecutive or identical recent activity events
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
        <div className="space-y-6 animate-pulse">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="space-y-2">
              <div className="h-7 w-56 bg-muted/60 rounded-lg" />
              <div className="h-4 w-72 bg-muted/40 rounded-lg" />
            </div>
            <div className="h-9 w-44 bg-muted/60 rounded-lg" />
          </div>
          <div className="h-16 bg-muted/30 rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted/40 rounded-xl" />
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
        <div className="max-w-2xl mx-auto py-16">
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
      <div className="space-y-4 sm:space-y-5">
        {/* Header - Compact Single Row Layout */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Dashboard Overview
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Welcome back! Here is what is happening with your operations today.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDashboardData}
              title="Refresh Dashboard Data"
              className="shrink-0 h-8 w-8 rounded-lg"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
            <DateTimeWeather />
          </div>
        </div>

        {/* Compact Subscription Status */}
        <SubscriptionStatus />

        {/* Proactive Real-Data Inventory Stockout / Health Alert */}
        <ProactiveAIInsights />

        {/* Key Metrics - 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "Active Jobs",
              value: activeJobs,
              sub: activeJobs === 0 ? "No open jobs" : `${activeJobs} in-progress & open`,
              icon: Briefcase,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20"
            },
            {
              label: "Total Employees",
              value: totalEmployees,
              sub: totalEmployees === 0 ? "No staff registered" : `${totalEmployees} Registered crew`,
              icon: Users,
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20"
            },
            {
              label: "Today's Attendance",
              value: todayAttendance,
              sub: totalEmployees > 0
                ? (todayAttendance === 0 ? `0 of ${totalEmployees} clocked in` : `${todayAttendance} of ${totalEmployees} present`)
                : "No employees added",
              icon: Clock,
              color: "text-purple-600 dark:text-purple-400",
              bg: "bg-purple-500/10",
              border: "border-purple-500/20"
            },
            {
              label: "Budget Utilization",
              value: `${Number(budgetUtil || 0).toFixed(1)}%`,
              sub: totalBudget > 0
                ? `₹${Number(totalSpent || 0).toLocaleString()} of ₹${Number(totalBudget).toLocaleString()}`
                : totalSpent > 0
                ? `₹${Number(totalSpent || 0).toLocaleString()} spent (No cap)`
                : "No budget cap set",
              icon: DollarSign,
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-500/10",
              border: "border-amber-500/20"
            },
          ].map((stat) => (
            <Card key={stat.label} className={cn("hover:border-primary/40 transition-all border shadow-xs", stat.border)}>
              <CardContent className="p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{stat.label}</p>
                    <div className={cn("text-xl sm:text-2xl font-black tracking-tight mt-0.5", stat.color)}>{stat.value}</div>
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">{stat.sub}</p>
                  </div>
                  <div className={cn("p-2 sm:p-2.5 rounded-xl shrink-0", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Executive Approval Command Center KPI Strip */}
        {pendingApprovals > 0 && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/20 p-3 sm:p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-black text-indigo-900 dark:text-indigo-200">Executive Approval Center</span>
                <span className="px-2 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                  {pendingApprovals} pending
                </span>
              </div>
              <Button
                size="sm"
                className="h-6 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 rounded-lg"
                onClick={() => router.push("/owner/jobs?view=approvals")}
              >
                Review <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: "Employee Requests", count: approvalCounts.employee, icon: UserCheck, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950/50", href: "/owner/jobs?view=approvals&category=jobs" },
                { label: "Customer Inquiries", count: approvalCounts.customer, icon: Users, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-950/50", href: "/owner/jobs?view=approvals&category=customers" },
                { label: "Invoice & Finance", count: approvalCounts.invoice, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/50", href: "/owner/jobs?view=approvals&category=finance" },
                { label: "Material Requests", count: approvalCounts.inventory, icon: Package, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/50", href: "/owner/jobs?view=approvals&category=inventory" },
              ].map((kpi) => (
                <button
                  key={kpi.label}
                  className="group flex items-center gap-2.5 p-2 rounded-lg bg-background border border-border/60 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer text-left"
                  onClick={() => router.push(kpi.href)}
                >
                  <div className={cn("p-1.5 rounded-md shrink-0", kpi.bg)}>
                    <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-black text-foreground leading-none">{kpi.count}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-tight truncate">{kpi.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Operational Focus: Active Projects & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Active Projects */}
          <Card className="border border-border/70 shadow-xs flex flex-col">
            <CardHeader className="py-2.5 px-4 border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                    <Building2 className="h-4 w-4 text-primary" />
                    Active Projects
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">Jobs currently in progress or accepted</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => router.push("/owner/jobs")}>
                  View All Jobs <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 flex-1 space-y-2.5">
              {Array.isArray(metrics?.activeProjects) && metrics.activeProjects.length > 0 ? (
                metrics.activeProjects.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="p-2.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/20 transition-all cursor-pointer space-y-1.5"
                    onClick={() => router.push("/owner/jobs")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">{job.title || "Untitled Job"}</span>
                      <span className={cn("text-[10px] px-2 py-0.2 rounded-full font-bold uppercase shrink-0", statusColor(job.employee_status !== 'pending' ? job.employee_status : job.status))}>
                        {job.employee_status !== 'pending' ? job.employee_status : job.status}
                      </span>
                    </div>

                    <Progress value={Number(job.progress || 0)} className="h-1.5" />

                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{job.assignee_name ? `Assigned: ${job.assignee_name}` : "Unassigned"}</span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span>{Number(job.progress || 0)}% completed</span>
                        <span className={cn("capitalize px-1.5 py-0.2 rounded font-semibold text-[9px]", statusColor(job.priority))}>
                          {job.priority || "medium"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                  <Briefcase className="h-7 w-7 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No active projects</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">All jobs are currently completed or closed.</p>
                  <Button variant="outline" size="sm" className="mt-2.5 text-xs h-7 rounded-lg" onClick={() => router.push("/owner/jobs")}>
                    Create a Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Operational Activity */}
          <Card className="border border-border/70 shadow-xs flex flex-col">
            <CardHeader className="py-2.5 px-4 border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Recent Operational Activity
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">Company operational updates and audit stream</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => router.push("/owner/messages")}>
                  View Alerts <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 flex-1 space-y-2">
              {deduplicatedActivity.length > 0 ? (
                deduplicatedActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {activity.priority === "high" || activity.type === "alert" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{activity.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{activity.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/70 shrink-0 font-medium whitespace-nowrap pl-1">
                      {formatActivityTime(activity.created_at)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                  <TrendingUp className="h-7 w-7 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No recent activity</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Your operational stream is up to date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Controls / Quick Workflows */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-tight uppercase text-muted-foreground">Quick System Workflows</h2>
            <span className="text-[11px] text-muted-foreground">Direct module access</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {quickActions.map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="h-11 px-3 flex items-center gap-2.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30 active:scale-[0.99] transition-all text-left group cursor-pointer shadow-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  <Icon className="h-3.5 w-3.5" />
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
