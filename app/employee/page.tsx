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
import { logger } from "@/lib/logger"
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
import { cn } from "@/lib/utils"

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

  // ─── Location banner state (hook now lives in EmployeeLayout) ─────────────
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "unsupported" | null
  >(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationPermission("unsupported")
      return
    }
    if (!("permissions" in navigator)) {
      setLocationPermission("prompt")
      return
    }
    navigator.permissions.query({ name: "geolocation" }).then(result => {
      setLocationPermission(result.state as "granted" | "denied" | "prompt")
      result.onchange = () => setLocationPermission(result.state as "granted" | "denied" | "prompt")
    })
  }, [])
  // ────────────────────────────────────────────────────────────────────────────

  const [todayAttendance, setTodayAttendance] = useState<AttendanceToday | null>(null)
  const [hoursThisWeek, setHoursThisWeek] = useState<number>(0)
  const [pendingRequests, setPendingRequests] = useState<number>(0)
  const [loadingStats, setLoadingStats] = useState(true)

  // Filter jobs assigned to this employee (active = accepted by employee OR status=active)
  const myJobs = jobs.filter((job: any) => {
    const userId = String(user?.id || "")
    // Check normalized assignedEmployees array (comes from job-context normalization)
    const assigned = Array.isArray(job.assignedEmployees) ? job.assignedEmployees : []
    const inAssigned = assigned.some((a: any) => String(a) === userId)
    // Also check direct assigned_to field (comes directly from backend)
    const assignedTo = job.assigned_to ? String(job.assigned_to) : ""
    const isAssignedTo = assignedTo === userId
    return inAssigned || isAssignedTo
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
    } catch (err: any) {
      logger.error("Error fetching dashboard stats:", err)
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
    if (!dateStr) return "Unknown"
    const timestamp = new Date(dateStr).getTime()
    if (isNaN(timestamp)) return "Unknown"
    
    const diff = Date.now() - timestamp
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

        {/* ── Location Consent Banner ─────────────────────────────────── */}
        {!bannerDismissed && locationPermission !== null && (
          <div
            className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${locationPermission === "denied" || locationPermission === "unsupported"
              ? "bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700"
              : "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
              }`}
          >
            <span>
              {locationPermission === "denied" || locationPermission === "unsupported"
                ? "⚠️ Location sharing is disabled. Your organization may require it during working hours."
                : "📍 Your location may be tracked by your organization during working hours."}
            </span>
            <button
              onClick={() => setBannerDismissed(true)}
              className="ml-2 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
        {/* ────────────────────────────────────────────────────────────── */}

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, <span className="text-primary">{user?.name?.split(" ")[0]}</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              {todayAttendance?.is_late 
                ? "Shift started with a late check-in. Let's focus on productivity today."
                : "Your performance metrics and shift schedules are up to date."}
            </p>
          </div>
          <DateTimeWeather />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Active Assignments", value: Array.isArray(activeJobs) ? activeJobs.length : 0, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Hours Logged", value: `${Number(hoursThisWeek || 0).toFixed(1)}h`, icon: Clock, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20" },
            { label: "Supply Requests", value: Number(pendingRequests || 0), icon: Package, color: "text-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/20" },
            { label: "New Alerts", value: Number(unreadNotifs || 0), icon: Bell, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          ].map((stat, i) => (
            <Card key={i} className={cn("premium-card hover-lift-subtle border", stat.border)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{stat.label}</p>
                    <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                  </div>
                  <div className={cn("p-3 rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clock In/Out and My Active Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-fade-in-left stagger-5">
            <ClockInOut
              currentStatus={clockStatus}
              hoursToday={hoursToday}
              attendanceRecord={todayAttendance}
              onClockChange={fetchStats}
            />
          </div>

          <Card className="premium-card hover-lift border-none shadow-sm overflow-hidden">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight">Active Assignments</CardTitle>
                  <CardDescription>Directly assigned project responsibilities</CardDescription>
                </div>
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {Array.isArray(activeJobs) && activeJobs.length > 0 ? (
                activeJobs.slice(0, 3).map((job: any) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-2xl bg-secondary/30 border border-transparent hover:border-primary/20 hover:bg-secondary/50 transition-all cursor-pointer group/item"
                    onClick={() => router.push("/employee/jobs")}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm group-hover/item:text-primary transition-colors">{job.title || "Untitled Project"}</h4>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold px-1.5 py-0 tracking-widest">
                        {job.priority || "Normal"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Work Progress</span>
                        <span className="text-primary">{Number(job.progress || 0)}%</span>
                      </div>
                      <Progress value={Number(job.progress || 0)} className="h-1.5" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary" />
                      {job.location || "On-site Assignment"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-sm font-bold text-muted-foreground">No active assignments</p>
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
                  <div className="p-2 bg-green-500 rounded-full shrink-0">
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
                    {Number(hoursToday || 0) > 0 && (
                      <p className="text-xs text-green-700 font-bold tracking-tight">{Number(hoursToday || 0).toFixed(1)}h worked today</p>
                    )}
                  </div>
                </div>
              )}

              {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
                recentActivity.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 hover-lift ${notif.read ? "opacity-70" : "bg-accent/5 border-l-2 border-primary"
                      }`}
                  >
                    <div className={`p-2 rounded-full shrink-0 ${getActivityBg(notif.type)} shadow-sm`}>
                      {getActivityIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black tracking-tight leading-none mb-1">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                      <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/50 mt-1.5">{formatTimeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    )}
                  </div>
                ))
              ) : !todayAttendance?.check_in_time ? (
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-sm font-bold text-muted-foreground">No recent activity</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="premium-card hover-lift border-none shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-black tracking-tight">Workstream Controls</CardTitle>
              <CardDescription>Frequently accessed employee tools</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Request Materials", icon: Package, href: "/employee/materials", color: "text-orange-500", bg: "hover:bg-orange-50 dark:hover:bg-orange-950/20" },
                  { label: "Message Hub", icon: MessageSquare, href: "/employee/messages", color: "text-primary", bg: "hover:bg-primary/5" },
                  { label: "Log Attendance", icon: Clock, href: "/employee/attendance", color: "text-green-500", bg: "hover:bg-green-50 dark:hover:bg-green-950/20" },
                  { label: "Access Payroll", icon: DollarSign, href: "/employee/payroll", color: "text-blue-500", bg: "hover:bg-blue-50 dark:hover:bg-blue-950/20" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className={cn(
                      "p-5 rounded-2xl border border-border/50 transition-all active:scale-95 flex flex-col items-center gap-3 group",
                      action.bg
                    )}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground group-hover:scale-110 group-hover:text-inherit transition-all">
                      <action.icon className={cn("h-6 w-6", action.color)} />
                    </div>
                    <span className="text-xs font-bold tracking-tight text-center">{action.label}</span>
                  </button>
                ))}
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
                  <AlertCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
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
