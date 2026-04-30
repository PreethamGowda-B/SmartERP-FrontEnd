"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import {
  Building2, Users, Clock, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Briefcase, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateTimeWeather } from "@/components/date-time-weather"
import { DashboardTrialBanner } from "@/components/dashboard-trial-banner"
import { SubscriptionStatus } from "@/components/subscription-status"
import { ErrorView } from "@/components/ui/error-view"
import { SkeletonList, SkeletonCard } from "@/components/ui/skeleton-card"

import { apiClient } from "@/lib/apiClient"
import { useAuth } from "@/contexts/auth-context"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"

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
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "in_progress":
    case "active":
    case "accepted":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "open":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}

export default function OwnerDashboard() {
  const router = useRouter()
  const { isLoading: authLoading } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [metricsData, activityData] = await Promise.all([
        apiClient("/api/dashboard/owner/metrics"),
        apiClient("/api/dashboard/owner/recent-activity"),
      ])
      setMetrics(metricsData)
      setRecentActivity(Array.isArray(activityData) ? activityData : [])
    } catch (err: any) {
      logger.error("Error fetching dashboard data:", err)
      setError({
        title: "Dashboard update failed",
        message: err.message || "We couldn't synchronize your business metrics. Please check your network.",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) fetchDashboardData()
  }, [fetchDashboardData, authLoading])

  const activeJobs    = metrics?.activeJobs ?? 0
  const totalEmployees = metrics?.activeEmployees ?? 0
  const todayAttendance = metrics?.todayAttendance ?? 0
  const budgetUtil    = parseFloat(metrics?.budgetUtilization ?? "0")
  const totalSpent    = metrics?.totalSpent ?? 0

  const statCards = [
    {
      label: "Active Jobs",
      value: activeJobs,
      sub: "Revenue generating",
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      accent: "oklch(0.55 0.18 240)",
    },
    {
      label: "Total Employees",
      value: totalEmployees,
      sub: "Workforce strength",
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      accent: "oklch(0.55 0.15 160)",
    },
    {
      label: "Today's Attendance",
      value: todayAttendance,
      sub: "Clocked in today",
      icon: Clock,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-500/10",
      accent: "oklch(0.55 0.18 290)",
    },
    {
      label: "Budget Utilization",
      value: `${Number(budgetUtil || 0).toFixed(1)}%`,
      sub: `₹${Number(totalSpent || 0).toLocaleString()} utilized`,
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      accent: "oklch(0.70 0.18 75)",
    },
  ]

  const quickActions = [
    { label: "Create Job",      icon: Briefcase,  href: "/owner/jobs" },
    { label: "Add Employee",    icon: Users,       href: "/owner/employees" },
    { label: "Process Payroll", icon: DollarSign,  href: "/owner/payroll" },
    { label: "View Reports",    icon: TrendingUp,  href: "/owner/reports" },
  ]

  if (loading && !metrics) {
    return (
      <OwnerLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-56 shimmer rounded-lg" />
              <div className="h-4 w-80 shimmer rounded-md" />
            </div>
            <div className="h-9 w-40 shimmer rounded-lg" />
          </div>
          <SkeletonList count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonCard className="h-[360px]" />
            <SkeletonCard className="h-[360px]" />
          </div>
        </div>
      </OwnerLayout>
    )
  }

  if (error && !metrics) {
    return (
      <OwnerLayout>
        <div className="max-w-2xl mx-auto py-20">
          <ErrorView title={error.title} message={error.message} onRetry={fetchDashboardData} />
        </div>
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout>
      <div className="space-y-8 animate-in fade-in duration-700">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-normal">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDashboardData}
              title="Refresh"
              className="h-8 w-8"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <DateTimeWeather />
          </div>
        </div>

        <SubscriptionStatus />

        {/* ── Metric cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <div
              key={stat.label}
              className={cn("metric-card animate-fade-in-up", `stagger-${i + 1}`)}
              style={{ "--metric-accent": stat.accent } as React.CSSProperties}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-label mb-2">{stat.label}</p>
                    <p className={cn("text-2xl font-semibold tracking-tight", stat.color)}>
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 font-normal">{stat.sub}</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl shrink-0", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </div>
          ))}
        </div>

        {/* ── Active Projects + Recent Activity ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Active Projects */}
          <Card className="animate-fade-in-up stagger-1">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Active Projects</CardTitle>
              </div>
              <CardDescription className="text-xs font-normal">
                Jobs currently in progress or accepted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {Array.isArray(metrics?.activeProjects) && metrics.activeProjects.length > 0 ? (
                metrics.activeProjects.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-lg border border-border/60 hover:border-primary/25 hover:bg-accent/30 transition-all duration-200 cursor-pointer group"
                    onClick={() => router.push("/owner/jobs")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate mr-2 group-hover:text-primary transition-colors">
                        {job.title || "Untitled Project"}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide shrink-0",
                          statusColor(job.employee_status !== "pending" ? job.employee_status : job.status),
                        )}
                      >
                        {job.employee_status !== "pending" ? job.employee_status : job.status}
                      </span>
                    </div>
                    <Progress value={Number(job.progress || 0)} className="h-1.5" />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[11px] text-muted-foreground">{Number(job.progress || 0)}% complete</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-medium capitalize",
                          statusColor(job.priority),
                        )}
                      >
                        {job.priority || "medium"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Briefcase className="h-9 w-9 mx-auto text-muted-foreground/25 mb-2.5" />
                  <p className="text-sm text-muted-foreground font-normal">No active projects</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => router.push("/owner/jobs")}
                  >
                    Create a job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="animate-fade-in-up stagger-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
              </div>
              <CardDescription className="text-xs font-normal">
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
                recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/40 transition-colors duration-150"
                  >
                    <div className="mt-0.5 shrink-0">
                      {activity.priority === "high" || activity.type === "alert" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-snug">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 font-normal leading-relaxed">
                        {activity.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1 font-normal">
                        {new Date(activity.created_at).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <TrendingUp className="h-9 w-9 mx-auto text-muted-foreground/25 mb-2.5" />
                  <p className="text-sm text-muted-foreground font-normal">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Actions ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
            <span className="text-meta">Common workflows</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map(({ label, icon: Icon, href }, i) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className={cn(
                  "premium-card p-5 flex flex-col items-center justify-center gap-3 group cursor-pointer",
                  "hover:border-primary/30 active:scale-[0.97] transition-all duration-150",
                  "animate-fade-in-up",
                  `stagger-${i + 1}`,
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {label}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </OwnerLayout>
  )
}
