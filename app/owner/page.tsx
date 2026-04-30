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
  RefreshCw
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
            <SkeletonCard className="h-[400px]" />
            <SkeletonCard className="h-[400px]" />
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
      <div className="space-y-8 animate-in fade-in duration-1000">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={fetchDashboardData} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <DateTimeWeather />
          </div>
        </div>

        <SubscriptionStatus />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              label: "Budget Utilization", value: `${budgetUtil.toFixed(1)}%`,
              sub: `₹${totalSpent.toLocaleString()} utilized`,
              icon: DollarSign, color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20"
            },
          ].map((stat) => (
            <Card key={stat.label} className={cn("premium-card hover-lift-subtle border", stat.border)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{stat.label}</p>
                    <div className={cn("text-3xl font-black tracking-tighter", stat.color)}>{stat.value}</div>
                    <p className="text-[10px] font-medium text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <div className={cn("p-3 rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Projects + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Active Projects
              </CardTitle>
              <CardDescription>Jobs currently in progress or accepted</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics?.activeProjects && metrics.activeProjects.length > 0 ? (
                metrics.activeProjects.map((job) => (
                  <div
                    key={job.id}
                    className="space-y-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-accent/20 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push("/owner/jobs")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate mr-2">{job.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColor(job.employee_status !== 'pending' ? job.employee_status : job.status)}`}>
                        {job.employee_status !== 'pending' ? job.employee_status : job.status}
                      </span>
                    </div>
                    <Progress value={job.progress || 0} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{job.progress || 0}% complete</span>
                      <span className={`capitalize px-1.5 py-0.5 rounded text-[10px] ${statusColor(job.priority)}`}>
                        {job.priority || "medium"} priority
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No active projects</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/owner/jobs")}>
                    Create a Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-all duration-200"
                  >
                    <div className="mt-0.5 shrink-0">
                      {activity.priority === "high" || activity.type === "alert" ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString("en-IN", {
                          dateStyle: "short", timeStyle: "short"
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">System Controls</h2>
            <span className="text-meta">Common workflows</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickActions.map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="premium-card p-6 flex flex-col items-center justify-center gap-4 group cursor-pointer border hover:border-primary/40 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
