"use client"

import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, Users, Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { useJobs } from "@/contexts/job-context"
import { useEmployees } from "@/contexts/employee-context"
import { useNotifications } from "@/contexts/notification-context"
import { WorkspaceLoadingSkeleton } from "@/components/workspace-loading-skeleton"

export default function OwnerDashboard() {
  const { jobs, isLoading: jobsLoading } = useJobs()
  const { employees, isLoading: employeesLoading } = useEmployees()
  const { notifications } = useNotifications()

  const isLoading = jobsLoading || employeesLoading

  const activeJobs = jobs.filter((job: any) => job.status === "active").length
  const totalEmployees = employees.filter((emp: any) => emp.status === "active").length
  const pendingNotifications = notifications.filter((n) => !n.read).length

  const totalBudget = jobs.reduce((sum: number, job: any) => sum + (job.budget || 0), 0)
  const totalSpent = jobs.reduce((sum: number, job: any) => sum + (job.spent || 0), 0)
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

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

  if (isLoading) {
    return (
      <OwnerLayout>
        <WorkspaceLoadingSkeleton />
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout>
      <div className="space-y-8 animate-in fade-in duration-1000">
        {/* Header */}
        <div className="animate-in slide-in-from-top duration-700">
          <h1 className="text-3xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground animate-in fade-in duration-500 delay-200">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-in slide-in-from-left duration-500 delay-100 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary animate-in zoom-in duration-300 delay-300">
                {activeJobs}
              </div>
              <p className="text-xs text-muted-foreground">From cloud sync</p>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-left duration-500 delay-200 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent animate-in zoom-in duration-300 delay-400">
                {totalEmployees}
              </div>
              <p className="text-xs text-muted-foreground">All employees active</p>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-right duration-500 delay-300 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Notifications</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground group-hover:text-green-500 group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 animate-in zoom-in duration-300 delay-500">
                {pendingNotifications}
              </div>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-right duration-500 delay-400 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
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
              {jobs
                .filter((job: any) => job.status === "active")
                .slice(0, 5)
                .map((job: any, index: number) => (
                  <div
                    key={job.id}
                    className={`space-y-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-accent/20 transition-all duration-300 animate-in slide-in-from-left duration-400`}
                    style={{ animationDelay: `${700 + index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium hover:text-primary transition-colors">{job.title}</h4>
                        <p className="text-sm text-muted-foreground">{job.client || "No client"}</p>
                      </div>
                      <Badge
                        variant={job.priority === "high" ? "destructive" : "secondary"}
                        className="animate-in zoom-in duration-300 hover:scale-110 transition-transform"
                      >
                        {job.priority || "normal"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{Math.round(((job.spent || 0) / (job.budget || 1)) * 100)}%</span>
                      </div>
                      <Progress
                        value={Math.round(((job.spent || 0) / (job.budget || 1)) * 100)}
                        className="h-2 transition-all duration-500 hover:h-3"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${(job.spent || 0).toLocaleString()} spent</span>
                      <span>${(job.budget || 0).toLocaleString()} budget</span>
                    </div>
                  </div>
                ))}
              {jobs.filter((job: any) => job.status === "active").length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No active jobs</p>
              )}
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-bottom duration-700 delay-600 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent animate-pulse" />
                Recent Notifications
              </CardTitle>
              <CardDescription>Latest updates and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.slice(0, 4).map((notification, index) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 transition-all duration-300 animate-in slide-in-from-right duration-400"
                  style={{ animationDelay: `${700 + index * 100}ms` }}
                >
                  <div
                    className={`p-2 rounded-full animate-pulse ${
                      notification.type === "success"
                        ? "bg-green-500"
                        : notification.type === "warning"
                          ? "bg-yellow-500"
                          : notification.type === "alert"
                            ? "bg-red-500"
                            : "bg-blue-500"
                    }`}
                  >
                    {notification.type === "success" ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : notification.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-white" />
                    ) : notification.type === "alert" ? (
                      <AlertTriangle className="h-4 w-4 text-white" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium hover:text-primary transition-colors">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="animate-in slide-in-from-bottom duration-700 delay-700 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary animate-bounce" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                onClick={() => handleQuickAction("create-job")}
                className="p-4 border border-border rounded-lg hover:bg-accent hover:border-primary hover:shadow-lg cursor-pointer transition-all duration-300 group animate-in zoom-in duration-400 delay-800 hover:scale-105"
              >
                <Building2 className="h-8 w-8 text-primary mb-2 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <h4 className="font-medium group-hover:text-primary transition-colors">Create New Job</h4>
                <p className="text-sm text-muted-foreground">Start a new project</p>
              </div>
              <div
                onClick={() => handleQuickAction("add-employee")}
                className="p-4 border border-border rounded-lg hover:bg-accent hover:border-primary hover:shadow-lg cursor-pointer transition-all duration-300 group animate-in zoom-in duration-400 delay-900 hover:scale-105"
              >
                <Users className="h-8 w-8 text-primary mb-2 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <h4 className="font-medium group-hover:text-primary transition-colors">Add Employee</h4>
                <p className="text-sm text-muted-foreground">Hire new team member</p>
              </div>
              <div
                onClick={() => handleQuickAction("process-payroll")}
                className="p-4 border border-border rounded-lg hover:bg-accent hover:border-primary hover:shadow-lg cursor-pointer transition-all duration-300 group animate-in zoom-in duration-400 delay-1000 hover:scale-105"
              >
                <DollarSign className="h-8 w-8 text-primary mb-2 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <h4 className="font-medium group-hover:text-primary transition-colors">Process Payroll</h4>
                <p className="text-sm text-muted-foreground">Run payroll cycle</p>
              </div>
              <div
                onClick={() => handleQuickAction("view-reports")}
                className="p-4 border border-border rounded-lg hover:bg-accent hover:border-primary hover:shadow-lg cursor-pointer transition-all duration-300 group animate-in zoom-in duration-400 delay-1100 hover:scale-105"
              >
                <TrendingUp className="h-8 w-8 text-primary mb-2 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <h4 className="font-medium group-hover:text-primary transition-colors">View Reports</h4>
                <p className="text-sm text-muted-foreground">Business analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
