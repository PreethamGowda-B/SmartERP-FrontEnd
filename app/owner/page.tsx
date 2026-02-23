"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Building2, Users, Clock, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Calendar, Loader2, Briefcase,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateTimeWeather } from "@/components/date-time-weather"

const API = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [metricsRes, activityRes] = await Promise.all([
        fetch(`${API}/api/dashboard/owner/metrics`, { credentials: "include", headers: authHeaders() }),
        fetch(`${API}/api/dashboard/owner/recent-activity`, { credentials: "include", headers: authHeaders() }),
      ])

      if (!metricsRes.ok) throw new Error(`Metrics failed: ${metricsRes.status}`)
      const metricsData = await metricsRes.json()
      setMetrics(metricsData)

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(Array.isArray(activityData) ? activityData : [])
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

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

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OwnerLayout>
    )
  }

  if (error) {
    return (
      <OwnerLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
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
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={fetchDashboardData} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <DateTimeWeather />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Active Jobs", value: activeJobs, sub: "Currently in progress",
              icon: Building2, color: "text-blue-600", iconColor: "group-hover:text-blue-500",
            },
            {
              label: "Total Employees", value: totalEmployees, sub: "Active team members",
              icon: Users, color: "text-green-600", iconColor: "group-hover:text-green-500",
            },
            {
              label: "Today's Attendance", value: todayAttendance, sub: "Employees present",
              icon: Clock, color: "text-purple-600", iconColor: "group-hover:text-purple-500",
            },
            {
              label: "Budget Utilization", value: `${budgetUtil.toFixed(1)}%`,
              sub: `₹${totalSpent.toLocaleString()} of ₹${totalBudget.toLocaleString()}`,
              icon: DollarSign, color: "text-yellow-600", iconColor: "group-hover:text-yellow-500",
            },
          ].map(({ label, value, sub, icon: Icon, color, iconColor }) => (
            <Card key={label} className="hover:scale-105 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-4 w-4 text-muted-foreground ${iconColor} transition-all duration-300`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <p className="text-xs text-muted-foreground">{sub}</p>
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map(({ label, icon: Icon, href }) => (
                <button
                  key={label}
                  onClick={() => router.push(href)}
                  className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all duration-300 text-center group"
                >
                  <Icon className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">{label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
