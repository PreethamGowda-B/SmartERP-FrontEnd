"use client"

import { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, Users, Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Calendar, Loader2 } from "lucide-react"
import { DateTimeWeather } from "@/components/date-time-weather"
import { apiClient } from "@/lib/apiClient"

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
  id: number
  type: string
  title: string
  message: string
  priority: string
  created_at: string
}

export default function OwnerDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [metricsData, activityData] = await Promise.all([
          apiClient("/api/dashboard/owner/metrics"),
          apiClient("/api/dashboard/owner/recent-activity")
        ])
        setMetrics(metricsData)
        setRecentActivity(activityData)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const activeJobs = metrics?.activeJobs || 0
  const totalEmployees = metrics?.activeEmployees || 0
  const todayAttendance = metrics?.todayAttendance || 0
  const budgetUtilization = parseFloat(metrics?.budgetUtilization || "0")
  const totalBudget = metrics?.totalBudget || 0
  const totalSpent = metrics?.totalSpent || 0

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "create-job":
        window.location.href = "/owner/jobs"
        break
      case "add-employee":
        window.location.href = "/owner/employees"
        break
      case "process-payroll":
        window.location.href = "/owner/payroll"
        break
      case "view-reports":
        window.location.href = "/owner/reports"
        break
    }
  }

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout>
      <div className="space-y-8 animate-in fade-in duration-1000">
        {/* Header */}
        <div className="animate-in slide-in-from-top duration-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-muted-foreground animate-in fade-in duration-500 delay-200">
                Welcome back! Here's what's happening with your business today.
              </p>
            </div>
            <DateTimeWeather />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-in slide-in-from-left duration-500 delay-100 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 animate-in zoom-in duration-300 delay-300">
                {activeJobs}
              </div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-left duration-500 delay-200 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-green-500 group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 animate-in zoom-in duration-300 delay-400">
                {totalEmployees}
              </div>
              <p className="text-xs text-muted-foreground">Active team members</p>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-left duration-500 delay-300 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 animate-in zoom-in duration-300 delay-500">
                {todayAttendance}
              </div>
              <p className="text-xs text-muted-foreground">Employees present</p>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-left duration-500 delay-400 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-yellow-500 group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 animate-in zoom-in duration-300 delay-600">
                {budgetUtilization.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                ${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-in slide-in-from-bottom duration-700 delay-500 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary animate-pulse" />
                Active Projects
              </CardTitle>
              <CardDescription>Current job status and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics?.activeProjects && metrics.activeProjects.length > 0 ? (
                metrics.activeProjects.map((job, index) => (
                  <div
                    key={job.id}
                    className="space-y-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-accent/20 transition-all duration-300 animate-in slide-in-from-left duration-400"
                    style={{ animationDelay: `${700 + index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{job.title}</span>
                      <Badge variant="secondary">{job.status}</Badge>
                    </div>
                    <Progress value={job.progress || 0} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{job.progress || 0}% complete</span>
                      <span>${job.spent?.toLocaleString() || 0} spent</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No active projects</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="animate-in slide-in-from-bottom duration-700 delay-600 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-all duration-200 animate-in slide-in-from-right duration-400"
                    style={{ animationDelay: `${700 + index * 100}ms` }}
                  >
                    <div className="mt-1">
                      {activity.priority === "high" ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="animate-in slide-in-from-bottom duration-700 delay-700">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleQuickAction("create-job")}
                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all duration-300 text-center group"
              >
                <Building2 className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Create Job</p>
              </button>
              <button
                onClick={() => handleQuickAction("add-employee")}
                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all duration-300 text-center group"
              >
                <Users className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Add Employee</p>
              </button>
              <button
                onClick={() => handleQuickAction("process-payroll")}
                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all duration-300 text-center group"
              >
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Process Payroll</p>
              </button>
              <button
                onClick={() => handleQuickAction("view-reports")}
                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all duration-300 text-center group"
              >
                <Calendar className="h-6 w-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">View Reports</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
