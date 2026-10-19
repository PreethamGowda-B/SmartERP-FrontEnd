"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  MapPin,
  Sparkles,
  ShieldCheck,
  Flame,
  Activity,
  Download,
  Filter,
  Check,
  Radio,
  Timer,
  ChevronRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { ErrorView } from "@/components/ui/error-view"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { AttendanceStatus } from "@/components/attendance/attendance-ui"
import { cn } from "@/lib/utils"

interface AttendanceRecord {
  id: number
  date: string
  check_in_time: string | null
  check_out_time: string | null
  working_hours: number | null
  status: string | null
  is_late: boolean
  is_auto_clocked_out?: boolean
}

interface AttendancePolicyView {
  shiftStart: string
  shiftEnd: string
  clockInCutoff: string
  automaticClockOutTime: string
  timezone: string
}

interface ClockEligibility {
  allowed: boolean
  code?: string | null
  reason?: string | null
  is_late?: boolean
  status?: string | null
}

export default function TimeTrackingPage() {
  const { user } = useAuth()
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true)
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0)
  const [attendancePolicy, setAttendancePolicy] = useState<AttendancePolicyView | null>(null)
  const [eligibility, setEligibility] = useState<ClockEligibility | null>(null)
  const [historyFilter, setHistoryFilter] = useState<"all" | "present" | "late" | "absent">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Live chronometer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate live shift elapsed time
  useEffect(() => {
    if (todayAttendance?.check_in_time && !todayAttendance?.check_out_time) {
      const checkInMs = new Date(todayAttendance.check_in_time).getTime()
      const updateElapsed = () => {
        const nowMs = Date.now()
        setElapsedSeconds(Math.max(0, Math.floor((nowMs - checkInMs) / 1000)))
      }
      updateElapsed()
      const interval = setInterval(updateElapsed, 1000)
      return () => clearInterval(interval)
    } else if (todayAttendance?.working_hours) {
      setElapsedSeconds(Math.round(todayAttendance.working_hours * 3600))
    } else {
      setElapsedSeconds(0)
    }
  }, [todayAttendance?.check_in_time, todayAttendance?.check_out_time, todayAttendance?.working_hours])

  // Fetch today's attendance
  const fetchTodayAttendance = useCallback(async () => {
    try {
      const [attendanceResult, policyResult] = await Promise.allSettled([
        apiClient<any>("/api/attendance/today"),
        apiClient<any>("/api/attendance/policy"),
      ])
      if (attendanceResult.status === "fulfilled") {
        setTodayAttendance(attendanceResult.value)
        setError("")
      } else {
        setError("Could not refresh today's attendance. Check your connection and try again.")
      }
      if (policyResult.status === "fulfilled") {
        setAttendancePolicy(policyResult.value?.policy || null)
        setEligibility(policyResult.value?.eligibility || null)
      }
    } catch (err: any) {
      logger.error("Error fetching today's attendance:", err)
    }
  }, [])

  // Fetch attendance history
  const fetchHistory = useCallback(async () => {
    try {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const data = await apiClient<any>(`/api/attendance/history?month=${currentMonth}&year=${currentYear}`)
      setHistory(Array.isArray(data) ? data : [])
    } catch (err: any) {
      logger.error("Error fetching history:", err)
      setError("Failed to load attendance records")
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchTodayAttendance()
      fetchHistory()
    }
  }, [user?.id, fetchTodayAttendance, fetchHistory])

  const refreshPendingCount = useCallback(async () => {
    try {
      const { getPendingAttendance } = await import("@/lib/db")
      const pending = await getPendingAttendance()
      setPendingOfflineCount(pending.length)
    } catch {}
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      fetchTodayAttendance()
      fetchHistory()
      refreshPendingCount()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    refreshPendingCount()
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return
      if (typeof navigator !== "undefined" && !navigator.onLine) return
      fetchTodayAttendance()
      fetchHistory()
      refreshPendingCount()
    }
    const timer = setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    window.addEventListener("attendance-status-changed", refresh)

    return () => {
      clearInterval(timer)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("focus", refresh)
      window.removeEventListener("attendance-status-changed", refresh)
    }
  }, [fetchTodayAttendance, fetchHistory, refreshPendingCount])

  const handleClockIn = async () => {
    setLoading(true)
    setError("")

    if (eligibility && !eligibility.allowed) {
      setError(eligibility.reason || "Clock-in is not permitted at this time under company shift policy.")
      setLoading(false)
      return
    }

    if (!navigator.onLine) {
      const { savePendingAttendance } = await import("@/lib/db")
      await savePendingAttendance({
        type: "clock-in",
        timestamp: new Date().toISOString(),
        status: "pending",
      })
      await refreshPendingCount()
      setError("Clock-in is pending on this device and was not recorded. Reconnect, verify your status, then submit a new punch. Offline timestamps require Owner review.")
      setLoading(false)
      return
    }

    try {
      const data = await apiClient<any>("/api/attendance/clock-in", { method: "POST" })
      setTodayAttendance(data)
      fetchHistory()
      if (typeof window !== "undefined") {
        localStorage.setItem("_clocked_in_date", new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }))
        window.dispatchEvent(new CustomEvent("attendance-status-changed"))
      }
    } catch (err: any) {
      setError(err.message || "Failed to clock in")
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async () => {
    setLoading(true)
    setError("")

    if (!navigator.onLine) {
      const { savePendingAttendance } = await import("@/lib/db")
      await savePendingAttendance({
        type: "clock-out",
        timestamp: new Date().toISOString(),
        status: "pending",
      })
      await refreshPendingCount()
      setError("Clock-out is pending on this device and was not recorded. Reconnect, verify your status, then submit a new punch. Offline timestamps require Owner review.")
      setLoading(false)
      return
    }

    try {
      const data = await apiClient<any>("/api/attendance/clock-out", { method: "POST" })
      setTodayAttendance(data)
      fetchHistory()
      if (typeof window !== "undefined") {
        localStorage.removeItem("_clocked_in_date")
        window.dispatchEvent(new CustomEvent("attendance-status-changed"))
      }
    } catch (err: any) {
      setError(err.message || "Failed to clock out")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    })
  }

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isClockedIn = Boolean(todayAttendance?.check_in_time && !todayAttendance?.check_out_time)
  const isClockedOut = Boolean(todayAttendance?.check_in_time && todayAttendance?.check_out_time)
  const canClockIn = !todayAttendance?.check_in_time && pendingOfflineCount === 0 && (eligibility ? eligibility.allowed : true)

  // Monthly summary stats
  const totalDaysPresent = history.filter((r) => Boolean(r.check_in_time) || ["present", "late", "half_day"].includes(r.status || "")).length
  const totalHoursWorked = history.reduce((acc, r) => acc + (parseFloat(String(r.working_hours)) || 0), 0)
  const recordedCheckIns = history.filter((r) => Boolean(r.check_in_time))
  const onTimeCount = recordedCheckIns.filter((r) => !r.is_late && r.status !== "late").length
  const lateCount = history.filter((r) => r.is_late || r.status === "late").length
  const absentCount = history.filter((r) => !r.check_in_time && r.status === "absent").length
  const onTimeRate = recordedCheckIns.length ? Math.round((onTimeCount / recordedCheckIns.length) * 100) : 0

  const filteredHistory = history.filter((record) => {
    if (historyFilter === "all") return true
    const isLateRecord = record.is_late || record.status === "late"
    const hasClockIn = Boolean(record.check_in_time)
    const isPresent = hasClockIn || ["present", "late", "half_day"].includes(record.status || "")
    if (historyFilter === "late") return isLateRecord
    if (historyFilter === "present") return isPresent && !isLateRecord
    if (historyFilter === "absent") return !isPresent
    return true
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchTodayAttendance(), fetchHistory(), refreshPendingCount()])
    setIsRefreshing(false)
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Time &amp; Shift Console</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Company attendance status, active shift chronometer, and monthly compliance audit trail · Asia/Kolkata
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl h-9"
              disabled={isRefreshing}
              onClick={handleRefresh}
              aria-label="Refresh attendance"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/80 text-xs font-semibold">
              <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              <span>{isOnline ? "Connected" : "Offline"}</span>
            </div>
          </div>
        </div>

        {/* Shift Schedule Timeline Banner */}
        <Card className="overflow-hidden rounded-2xl border-border/80 bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                    STANDARD SHIFT
                  </Badge>
                  <span className="text-xs font-bold text-foreground">
                    {attendancePolicy ? `${attendancePolicy.shiftStart} – ${attendancePolicy.shiftEnd} (${attendancePolicy.timezone})` : "Enforcing company shift policy…"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Cutoff: <strong className="text-foreground">{attendancePolicy?.clockInCutoff || "—"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Timezone: <strong className="text-foreground">{attendancePolicy?.timezone || "Asia/Kolkata"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Auto checkout: <strong className="text-foreground">{attendancePolicy?.automaticClockOutTime || "—"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Real-time Digital Chronometer */}
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 text-center shrink-0 min-w-[170px] shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Time</p>
                <p className="text-xl font-bold font-mono tracking-tight text-foreground mt-0.5 tabular-nums">
                  {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {pendingOfflineCount > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs font-medium text-amber-900 dark:text-amber-200">
            {pendingOfflineCount} offline punch{pendingOfflineCount === 1 ? " is" : "es are"} saved as pending on this device. They have not changed attendance and will not be replayed automatically. Contact your Owner if the original offline time needs review.
          </div>
        )}

        {/* Error Alert if any */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Shift Notification:</span> {error}
            </div>
          </div>
        )}

        {/* Primary Station: Live Workstation Shift Hub */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Main Clock-In/Out Console */}
          <Card className="flex flex-col justify-between rounded-2xl border-border/80 shadow-sm lg:col-span-7">
            <CardHeader className="pb-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-bold">Shift Attendance Hub</CardTitle>
                </div>
                <Badge
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isClockedIn
                      ? "bg-emerald-600 hover:bg-emerald-600 text-white shadow-xs"
                      : isClockedOut
                      ? "bg-blue-600 hover:bg-blue-600 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isClockedIn ? "ON ACTIVE SHIFT" : isClockedOut ? "SHIFT COMPLETED" : "NOT CLOCKED IN"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-6 flex-1">
              {/* Running Time Display */}
              <div className="text-center py-5 bg-secondary/30 rounded-2xl border border-border/50 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {isClockedIn ? "Active Shift Duration" : isClockedOut ? "Total Shift Time" : "Shift Timer"}
                </p>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-foreground tabular-nums">
                  {formatDuration(elapsedSeconds)}
                </div>
                <p className="text-xs text-muted-foreground font-medium pt-1">
                  {isClockedIn
                    ? `Clocked in at ${formatTime(todayAttendance?.check_in_time || null)}`
                    : isClockedOut
                    ? `Completed shift from ${formatTime(todayAttendance?.check_in_time || null)} to ${formatTime(todayAttendance?.check_out_time || null)}`
                    : "Ready to start your work shift"}
                </p>
              </div>

              {/* Shift Policy Notice */}
              {eligibility && !eligibility.allowed && !isClockedIn && !isClockedOut && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Shift Policy Notice: </span>
                    {eligibility.reason || "Clock-in is not permitted at this time under company shift policy."}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Button
                  onClick={handleClockIn}
                  disabled={!canClockIn || loading}
                  className={cn(
                    "h-12 text-sm font-bold shadow-sm gap-2 rounded-xl transition-all",
                    canClockIn
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "opacity-40"
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  {eligibility && !eligibility.allowed && !isClockedIn && !isClockedOut
                    ? "Shift Clock-in Closed"
                    : "Clock In to Shift"}
                </Button>

                <Button
                  onClick={handleClockOut}
                  disabled={!isClockedIn || loading || pendingOfflineCount > 0}
                  variant="outline"
                  className={cn(
                    "h-12 text-sm font-bold gap-2 rounded-xl transition-all",
                    isClockedIn
                      ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : "opacity-40"
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  Clock Out &amp; Sign Off
                </Button>
              </div>

              {/* Shift Stats Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Check-In</span>
                  <p className="text-sm font-bold text-foreground mt-0.5 tabular-nums">{formatTime(todayAttendance?.check_in_time || null)}</p>
                  {todayAttendance?.is_late && (
                    <Badge variant="destructive" className="text-[9px] mt-1 px-1.5 py-0 uppercase font-bold">
                      Late Arrival
                    </Badge>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Check-Out</span>
                  <p className="text-sm font-bold text-foreground mt-0.5 tabular-nums">{formatTime(todayAttendance?.check_out_time || null)}</p>
                  {todayAttendance?.is_auto_clocked_out && (
                    <Badge variant="outline" className="text-[9px] mt-1 px-1.5 py-0 uppercase font-bold text-orange-500 border-orange-500/30">
                      Auto Checkout
                    </Badge>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Logged Hours</span>
                  <p className="text-sm font-bold text-foreground mt-0.5 tabular-nums">
                    {todayAttendance?.working_hours ? `${Number(todayAttendance.working_hours).toFixed(1)} hrs` : "—"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Punctuality</span>
                  <div className="mt-1">
                    {todayAttendance?.check_in_time ? (
                      <AttendanceStatus status={todayAttendance.is_late ? "late" : "present"} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly KPI Overview */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-border/80 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Monthly Performance Analytics
                </CardTitle>
                <CardDescription className="text-xs">
                  {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })} attendance metrics
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Days Present</span>
                    <div className="text-2xl font-black text-foreground tabular-nums">{totalDaysPresent}</div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Active shifts logged</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Hours</span>
                    <div className="text-2xl font-black text-foreground tabular-nums">{totalHoursWorked.toFixed(1)}h</div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Monthly cumulative</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                    <div>
                      <div className="font-bold text-foreground">On-time check-ins: {onTimeRate}%</div>
                      <div className="text-[10px] text-muted-foreground">{onTimeCount} of {recordedCheckIns.length} recorded this month</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {recordedCheckIns.length ? "THIS MONTH" : "NO DATA"}
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Punch Verification
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Attendance is recorded and signed cryptographically by the company service. Location is logged only when GPS access is granted.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Monthly Attendance Audit Trail */}
        <Card className="border-border/80 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Monthly Attendance Audit Trail
                </CardTitle>
                <CardDescription className="text-xs">
                  Historical daily punch records, hours breakdown, and auto-checkout tracking.
                </CardDescription>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setHistoryFilter("all")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                    historyFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All ({history.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("present")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                    historyFilter === "present" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  On Time ({onTimeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("late")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                    historyFilter === "late" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Late ({lateCount})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("absent")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
                    historyFilter === "absent" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Absent ({absentCount})
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            {loading && history.length === 0 ? (
              <SkeletonList count={4} />
            ) : error && history.length === 0 ? (
              <ErrorView title="Records Unavailable" message={error} onRetry={fetchHistory} />
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <h4 className="text-xs font-bold text-foreground">No Attendance Logs Found</h4>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  {historyFilter !== "all" ? `No records matching the "${historyFilter}" filter.` : "Your daily clock-ins will appear here with hours logged and shift verification stamps."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredHistory.map((record) => {
                  const isLateRecord = record.is_late || record.status === "late"
                  const hasClockIn = Boolean(record.check_in_time)
                  const inconsistentAbsent = hasClockIn && record.status === "absent"
                  const isPresent = hasClockIn || ["present", "late", "half_day"].includes(record.status || "")
                  const dayNumber = Number(record.date.slice(8, 10))

                  return (
                    <div
                      key={record.id}
                      className="p-3.5 rounded-xl border border-border/70 bg-card hover:bg-secondary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-secondary/60 text-center flex flex-col items-center justify-center font-bold shrink-0 border border-border/50">
                          <span className="text-sm font-black text-foreground leading-none">
                            {dayNumber}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground mt-0.5">
                            {new Date(record.date).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{formatDate(record.date)}</span>
                            {isLateRecord && (
                              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 uppercase font-bold">
                                Late
                              </Badge>
                            )}
                            {record.is_auto_clocked_out && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase font-bold text-orange-500 border-orange-500/30">
                                Auto Checkout
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                            <span>In: <strong>{formatTime(record.check_in_time)}</strong></span>
                            <span>•</span>
                            <span>Out: <strong>{formatTime(record.check_out_time)}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Hours Logged</span>
                          <span className="text-sm font-bold font-mono text-foreground tabular-nums">
                            {record.working_hours ? `${Number(record.working_hours).toFixed(1)} hrs` : "—"}
                          </span>
                        </div>

                        <AttendanceStatus
                          status={
                            inconsistentAbsent
                              ? "incomplete"
                              : record.status === "half_day"
                              ? "half_day"
                              : ["leave", "on_leave"].includes(record.status || "")
                              ? "leave"
                              : isPresent
                              ? (isLateRecord ? "late" : "present")
                              : "absent"
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  )
}
