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
  Cpu,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Radio,
  FileText,
  AlertTriangle,
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
  const { jobs, updateJobStatus } = useJobs()
  const { notifications } = useNotifications()

  // Location Consent Banner state
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
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      setLocationPermission(result.state as "granted" | "denied" | "prompt")
      result.onchange = () => setLocationPermission(result.state as "granted" | "denied" | "prompt")
    })
  }, [])

  const [todayAttendance, setTodayAttendance] = useState<AttendanceToday | null>(null)
  const [hoursThisWeek, setHoursThisWeek] = useState<number>(0)
  const [pendingRequests, setPendingRequests] = useState<number>(0)
  const [loadingStats, setLoadingStats] = useState(true)

  // Filter jobs assigned to this employee
  const myJobs = jobs.filter((job: any) => {
    const userId = String(user?.id || "")
    const assigned = Array.isArray(job.assignedEmployees) ? job.assignedEmployees : []
    const inAssigned = assigned.some((a: any) => String(a) === userId)
    const assignedTo = job.assigned_to ? String(job.assigned_to) : ""
    return inAssigned || assignedTo === userId
  })

  const activeJobs = myJobs.filter((job: any) =>
    job.employee_status === "accepted" || job.status === "active" || job.status === "in_progress"
  )

  const unreadNotifs = notifications.filter((n) => !n.read).length

  const fetchStats = useCallback(async () => {
    if (!user) return
    setLoadingStats(true)
    try {
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
          const now = new Date()
          const monday = new Date(now)
          monday.setDate(now.getDate() - now.getDay() + 1)
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

  const hoursToday = todayAttendance?.working_hours
    ? parseFloat(String(todayAttendance.working_hours))
    : 0

  const clockStatus: "clocked-in" | "clocked-out" =
    todayAttendance?.check_in_time && !todayAttendance?.check_out_time
      ? "clocked-in"
      : "clocked-out"

  const weeklyProgress = Math.min(100, Math.round((hoursThisWeek / 40) * 100))

  return (
    <EmployeeLayout>
      <div className="space-y-7">
        {/* Location Consent Banner */}
        {!bannerDismissed && locationPermission !== null && (
          <div
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2 rounded-xl text-xs font-medium border shadow-xs transition-all",
              locationPermission === "denied" || locationPermission === "unsupported"
                ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                : "bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/30"
            )}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {locationPermission === "denied" || locationPermission === "unsupported"
                  ? "Location sharing is currently disabled. Shift tracking features may be limited."
                  : "Field location telemetry is active for work shifts and on-site task dispatch."}
              </span>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Executive Header & Weather */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"},{" "}
                <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                  {user?.name?.split(" ")[0] || "Specialist"}
                </span>
              </h1>
              <Badge variant="outline" className="text-[10px] font-mono tracking-wider font-bold py-0.5 px-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                {user?.position || "Field Service"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {user?.company_name ? `${user.company_name} Workspace` : "SmartERP Enterprise Hub"} • Shift schedule &amp; work assignments are synced.
            </p>
          </div>

          <DateTimeWeather />
        </div>

        {/* Quick Action Ribbon */}
        <div className="flex flex-wrap items-center gap-2.5 p-2 rounded-2xl bg-card border border-border/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 select-none">
            Quick Actions:
          </span>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 font-semibold gap-1.5 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border-border/70"
            onClick={() => router.push("/employee/time-tracking")}
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            {clockStatus === "clocked-in" ? "Clock Out" : "Clock In"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 font-semibold gap-1.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 border-border/70"
            onClick={() => router.push("/employee/machines")}
          >
            <Cpu className="h-3.5 w-3.5 text-blue-500" />
            Decode CNC Alarm
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 font-semibold gap-1.5 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 border-border/70"
            onClick={() => router.push("/employee/materials")}
          >
            <Package className="h-3.5 w-3.5 text-orange-500" />
            Request Parts
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 font-semibold gap-1.5 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border-border/70"
            onClick={() => router.push("/employee/hr-hub")}
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-500" />
            Apply Leave
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 font-semibold gap-1.5 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 border-border/70 ml-auto"
            onClick={() => router.push("/employee/knowledge-base")}
          >
            <BookOpen className="h-3.5 w-3.5 text-purple-500" />
            Technical SOPs
          </Button>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Active Assignments */}
          <Card className="border-border/80 shadow-xs hover:shadow-md transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Active Tasks &amp; Jobs
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                    {Array.isArray(activeJobs) ? activeJobs.length : 0}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 inline-block">
                    {myJobs.length} total assigned
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Hours Logged */}
          <Card className="border-border/80 shadow-xs hover:shadow-md transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Week Hours ({weeklyProgress}%)
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                    {Number(hoursThisWeek || 0).toFixed(1)}h
                  </div>
                  <div className="mt-2">
                    <Progress value={weeklyProgress} className="h-1.5" />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Supply Requests */}
          <Card className="border-border/80 shadow-xs hover:shadow-md transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Supply Requisitions
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                    {Number(pendingRequests || 0)}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 inline-block">
                    {pendingRequests > 0 ? "Pending approval" : "All orders fulfilled"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unread Alerts & Notifications */}
          <Card className="border-border/80 shadow-xs hover:shadow-md transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Alerts &amp; Notices
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                    {Number(unreadNotifs || 0)}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 inline-block">
                    {unreadNotifs > 0 ? "Requires review" : "System up to date"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary 2-Column: Shift Clock Card + Active Work Orders Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Shift Tracker Card */}
          <div className="lg:col-span-5 space-y-6">
            <ClockInOut
              currentStatus={clockStatus}
              hoursToday={hoursToday}
              attendanceRecord={todayAttendance}
              onClockChange={fetchStats}
            />

            {/* Quick Diagnostic Card for Field Service */}
            <Card className="border-border/80 shadow-xs bg-gradient-to-br from-card to-secondary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-sm font-bold">CNC Field Diagnostics</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    ONLINE
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Quick access to machine registries, electrical schematics, and Fanuc/Siemens alarm decoder.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs h-8 font-semibold"
                  onClick={() => router.push("/employee/machines")}
                >
                  <span className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-blue-500" /> Open Machine Registry
                  </span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs h-8 font-semibold"
                  onClick={() => router.push("/employee/knowledge-base")}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-purple-500" /> View Technical SOPs
                  </span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs h-8 font-semibold"
                  onClick={() => router.push("/employee/skills")}
                >
                  <span className="flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-amber-500" /> My Skill Passport
                  </span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active Work Order Dispatch Board */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-border/80 shadow-xs h-full flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Assigned Work Orders &amp; Responsibilities
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Live dispatch tasks requiring on-site execution or service sign-off.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 font-semibold text-primary"
                    onClick={() => router.push("/employee/jobs")}
                  >
                    View All Tasks →
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0 space-y-3.5 flex-1">
                {Array.isArray(activeJobs) && activeJobs.length > 0 ? (
                  activeJobs.slice(0, 4).map((job: any) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 hover:border-border transition-all cursor-pointer space-y-2.5"
                      onClick={() => router.push("/employee/jobs")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-foreground leading-snug">{job.title || "Field Work Order"}</h4>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-amber-500" />
                            {job.location || "On-site Client Plant"}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0",
                            job.priority === "urgent" || job.priority === "high"
                              ? "bg-red-500 text-white"
                              : "bg-secondary text-secondary-foreground"
                          )}
                        >
                          {job.priority || "Normal"}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                          <span>Completion Progress</span>
                          <span className="text-primary">{Number(job.progress || 0)}%</span>
                        </div>
                        <Progress value={Number(job.progress || 0)} className="h-1.5" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed rounded-xl space-y-2">
                    <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <h4 className="text-xs font-bold text-foreground">No Pending Work Orders</h4>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                      You are currently all caught up. Check back when new maintenance jobs are dispatched by your supervisor.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Stream: Recent Notifications & Company Noticeboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications Log */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  Recent Activity &amp; Broadcasts
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  onClick={() => router.push("/employee/notifications")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {notifications.length > 0 ? (
                notifications.slice(0, 4).map((notif: any) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-lg bg-secondary/30 border border-border/40 flex items-start gap-3 text-xs"
                  >
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{notif.title}</p>
                      <p className="text-muted-foreground text-[11px] line-clamp-1">{notif.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">No recent alerts recorded.</div>
              )}
            </CardContent>
          </Card>

          {/* Quick Support & HR Contact */}
          <Card className="border-border/80 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Employee Support &amp; Assistance
              </CardTitle>
              <CardDescription className="text-xs">
                Need operational assistance, safety supplies, or payroll clarification?
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pb-6">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs space-y-1">
                <span className="font-bold text-foreground">Direct Supervisor &amp; HR Support</span>
                <p className="text-[11px] text-muted-foreground">
                  Send real-time instant messages directly through the internal communications hub.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 text-xs h-8 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => router.push("/employee/messages")}
                >
                  Open Messages
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-8 font-semibold"
                  onClick={() => router.push("/employee/payroll")}
                >
                  My Payroll Records
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </EmployeeLayout>
  )
}
