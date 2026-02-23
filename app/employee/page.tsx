"use client"

import { useState, useEffect, useCallback } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { ClockInOut } from "@/components/clock-in-out"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useJobs } from "@/contexts/job-context"
import { useNotifications } from "@/contexts/notification-context"
import { DateTimeWeather } from "@/components/date-time-weather"
import { apiClient } from "@/lib/apiClient"
import {
  Briefcase,
  DollarSign,
  Package,
  MessageSquare,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Bell,
  Loader2,
  Calendar,
} from "lucide-react"

interface AttendanceToday {
  check_in_time: string | null
  check_out_time: string | null
  working_hours: number | null
  is_late: boolean
  status: string | null
}

interface AttendanceRecord {
  working_hours: number | null
  date: string
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { jobs } = useJobs()
  const { notifications } = useNotifications()

  const [todayAttendance, setTodayAttendance] = useState<AttendanceToday | null>(null)
  const [hoursThisWeek, setHoursThisWeek] = useState<number>(0)
  const [pendingRequests, setPendingRequests] = useState<number>(0)
  const [loadingStats, setLoadingStats] = useState(true)

  // Filter jobs assigned to this employee (accepted ones = active)
  const myJobs = jobs.filter((job: any) => {
    const assigned = Array.isArray(job.assignedEmployees) ? job.assignedEmployees : []
    return assigned.some((a: any) => String(a) === String(user?.id))
  })
  const activeJobs = myJobs.filter((job: any) =>
    job.employee_status === "accepted" || job.status === "active"
  )

  // Unread notifications
  const unreadNotifs = notifications.filter((n) => !n.read).length

  const fetchStats = useCallback(async () => {
    if (!user) return
    setLoadingStats(true)
    try {
      // Fetch in parallel
      const [todayRes, historyRes, materialsRes] = await Promise.allSettled([
        apiClient("/api/attendance/today"),
        apiClient("/api/attendance/history"),
        apiClient("/api/material-requests"),
      ])

      if (todayRes.status === "fulfilled") {
        setTodayAttendance(todayRes.value as AttendanceToday)
      }

      if (historyRes.status === "fulfilled") {
        const records = historyRes.value as AttendanceRecord[]
        if (Array.isArray(records)) {
          // Sum hours this current week (Mon-Sun)
          const now = new Date()
          const monday = new Date(now)
          monday.setDate(now.getDate() - now.getDay() + 1) // Monday
          monday.setHours(0, 0, 0, 0)

          const weekHours = records
            .filter((r) => new Date(r.date) >= monday)
            .reduce((sum, r) => sum + (parseFloat(String(r.working_hours)) || 0), 0)
          setHoursThisWeek(Math.round(weekHours * 10) / 10)
        }
      }

      if (materialsRes.status === "fulfilled") {
        const reqs = materialsRes.value as any[]
        if (Array.isArray(reqs)) {
          setPendingRequests(reqs.filter((r) => r.status === "pending").length)
        }
      }
    } finally {
      setLoadingStats(false)
    }
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Derive today's hours from attendance
  const hoursToday = todayAttendance?.working_hours
    ? parseFloat(String(todayAttendance.working_hours))
    : 0

  const clockStatus: "clocked-in" | "clocked-out" =
    todayAttendance?.check_in_time && !todayAttendance?.check_out_time
      ? "clocked-in"
      : "clocked-out"

  const hoursRemaining = Math.max(0, 40 - hoursThisWeek)

  // Recent notifications to show in activity section
  const recentActivity = notifications.slice(0, 4)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "job": return <Briefcase className="h-4 w-4 text-white" />
      case "material_request": return <Package className="h-4 w-4 text-white" />
      case "payroll": return <DollarSign className="h-4 w-4 text-white" />
      default: return <Bell className="h-4 w-4 text-white" />
    }
  }

  const getActivityBg = (type: string) => {
    switch (type) {
      case "job": return "bg-blue-500"
      case "material_request": return "bg-orange-500"
      case "payroll": return "bg-green-500"
      default: return "bg-primary"
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="animate-fade-in-down stagger-1 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground animate-fade-in-up stagger-2">
              Here's your work overview for today.
              {todayAttendance?.is_late && (
                <span className="ml-2 text-yellow-600 font-medium text-xs">⚠ Late check-in</span>
              )}
            </p>
          </div>
          <DateTimeWeather />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Jobs */}
          <Card className="animate-fade-in-left stagger-1 hover-lift hover-scale group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{activeJobs.length}</div>
              <p className="text-xs text-muted-foreground">Currently assigned</p>
            </CardContent>
          </Card>

          {/* Hours This Week */}
          <Card className="animate-fade-in-left stagger-2 hover-lift hover-scale group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-300" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">{hoursThisWeek}h</div>
                  <p className="text-xs text-muted-foreground">
                    {hoursRemaining > 0 ? `${hoursRemaining}h remaining to 40h` : "Full week completed 🎉"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pending Material Requests */}
          <Card className="animate-fade-in-right stagger-3 hover-lift hover-scale group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors duration-300" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">{pendingRequests}</div>
                  <p className="text-xs text-muted-foreground">Material requests</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Unread Notifications */}
          <Card className="animate-fade-in-right stagger-4 hover-lift hover-scale group cursor-pointer" onClick={() => router.push("/employee/notifications")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{unreadNotifs}</div>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Clock In/Out and My Active Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-fade-in-left stagger-5">
            <ClockInOut
              currentStatus={clockStatus}
              hoursToday={hoursToday}
              onClockChange={fetchStats}
            />
          </div>

          <Card className="animate-fade-in-right stagger-6 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-accent" />
                My Active Jobs
              </CardTitle>
              <CardDescription>Projects you're currently working on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeJobs.length > 0 ? (
                activeJobs.slice(0, 3).map((job: any, index: number) => (
                  <div
                    key={job.id}
                    className="space-y-2 p-3 rounded-lg border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{job.title}</h4>
                        {job.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </div>
                        )}
                      </div>
                      <Badge variant={job.priority === "high" ? "destructive" : "secondary"}>
                        {job.priority || "normal"}
                      </Badge>
                    </div>
                    {job.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active jobs assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real notifications as recent activity */}
          <Card className="animate-fade-in-up stagger-1 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Always show today's attendance status */}
              {todayAttendance?.check_in_time && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="p-2 bg-green-500 rounded-full flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Clocked {todayAttendance.check_out_time ? "out" : "in"} today
                    </p>
                    <p className="text-xs text-muted-foreground">
                      In: {new Date(todayAttendance.check_in_time).toLocaleTimeString()}
                      {todayAttendance.check_out_time && ` · Out: ${new Date(todayAttendance.check_out_time).toLocaleTimeString()}`}
                    </p>
                    {hoursToday > 0 && (
                      <p className="text-xs text-green-700 font-medium">{hoursToday.toFixed(1)}h worked today</p>
                    )}
                  </div>
                </div>
              )}

              {recentActivity.length > 0 ? (
                recentActivity.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 hover-lift ${notif.read ? "opacity-70" : "bg-accent/5"
                      }`}
                  >
                    <div className={`p-2 rounded-full flex-shrink-0 ${getActivityBg(notif.type)}`}>
                      {getActivityIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                      <p className="text-xs text-muted-foreground/60">{formatTimeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              ) : !todayAttendance?.check_in_time ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              ) : null}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-fade-in-up stagger-2 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent hover:bg-accent/10 transition-all duration-300 group"
                  onClick={() => router.push("/employee/materials")}
                >
                  <Package className="h-6 w-6 text-accent group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm group-hover:text-accent transition-colors duration-200">
                    Request Materials
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent hover:bg-primary/10 transition-all duration-300 group"
                  onClick={() => router.push("/employee/messages")}
                >
                  <MessageSquare className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm group-hover:text-primary transition-colors duration-200">
                    Messages
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 group"
                  onClick={() => router.push("/employee/attendance")}
                >
                  <Clock className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm group-hover:text-green-600 transition-colors duration-200">
                    Attendance
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group"
                  onClick={() => router.push("/employee/payroll")}
                >
                  <DollarSign className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm group-hover:text-blue-600 transition-colors duration-200">
                    Check Payroll
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unread Notifications Panel (if any) */}
        {notifications.filter(n => !n.read).length > 0 && (
          <Card className="animate-fade-in-up stagger-3 hover-lift border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Unread Notifications
                <Badge className="ml-auto">{unreadNotifs}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.filter(n => !n.read).slice(0, 3).map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg hover:bg-accent/20 transition-all duration-300"
                >
                  <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                  </div>
                </div>
              ))}
              {unreadNotifs > 3 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push("/employee/notifications")}>
                  View all {unreadNotifs} notifications →
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  )
}
