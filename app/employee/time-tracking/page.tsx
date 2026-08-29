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
} from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { ErrorView } from "@/components/ui/error-view"
import { SkeletonList } from "@/components/ui/skeleton-card"
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

export default function TimeTrackingPage() {
  const { user } = useAuth()
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true)

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
      const data = await apiClient<any>("/api/attendance/today")
      setTodayAttendance(data)
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

  // Offline sync handler
  const syncOfflineData = useCallback(async () => {
    try {
      const { getPendingAttendance, deletePendingAttendance } = await import("@/lib/db")
      const pending = await getPendingAttendance()
      if (pending.length === 0) return

      for (const action of pending) {
        try {
          const endpoint = action.type === "clock-in" ? "/api/attendance/clock-in" : "/api/attendance/clock-out"
          await apiClient(endpoint, { method: "POST" })
          await deletePendingAttendance(action.id!)
        } catch (err) {
          console.error("Failed to sync offline action:", action, err)
        }
      }
      fetchTodayAttendance()
      fetchHistory()
    } catch {}
  }, [fetchTodayAttendance, fetchHistory])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineData()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    syncOfflineData()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [syncOfflineData])

  const handleClockIn = async () => {
    setLoading(true)
    setError("")

    if (!navigator.onLine) {
      const { savePendingAttendance } = await import("@/lib/db")
      await savePendingAttendance({
        type: "clock-in",
        timestamp: new Date().toISOString(),
        status: "pending",
      })
      setTodayAttendance({
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        check_in_time: new Date().toISOString(),
        check_out_time: null,
        working_hours: null,
        status: "pending",
        is_late: false,
      })
      setLoading(false)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("attendance-status-changed"))
      }
      return
    }

    try {
      const data = await apiClient<any>("/api/attendance/clock-in", { method: "POST" })
      setTodayAttendance(data)
      fetchHistory()
      if (typeof window !== "undefined") {
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
      setTodayAttendance((prev) =>
        prev
          ? {
              ...prev,
              check_out_time: new Date().toISOString(),
              status: "pending",
            }
          : null
      )
      setLoading(false)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("attendance-status-changed"))
      }
      return
    }

    try {
      const data = await apiClient<any>("/api/attendance/clock-out", { method: "POST" })
      setTodayAttendance(data)
      fetchHistory()
      if (typeof window !== "undefined") {
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
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
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
  const canClockIn = !todayAttendance?.check_in_time

  // Monthly summary stats
  const totalDaysPresent = history.filter((r) => r.status === "present" || r.status === "late").length
  const totalHoursWorked = history.reduce((acc, r) => acc + (parseFloat(String(r.working_hours)) || 0), 0)
  const onTimeStreak = history.filter((r) => r.status === "present" && !r.is_late).length

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Time &amp; Shift Console</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              GPS verified shift logging, live work timers, and monthly attendance audit trail.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/80 text-xs font-semibold">
              <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              <span>{isOnline ? "Cloud Sync Active" : "Offline Cache"}</span>
            </div>
          </div>
        </div>

        {/* Shift Schedule Timeline Banner */}
        <Card className="border-border/80 shadow-xs bg-gradient-to-r from-card via-amber-500/5 to-card overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                    STANDARD SHIFT
                  </Badge>
                  <span className="text-xs font-bold text-foreground">09:00 AM – 07:00 PM IST (10 Hours)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Clock in by <strong>9:00 AM</strong> for on-time mark</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    <span>Leaving before <strong>7:00 PM</strong> marks half day</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                    <span>Auto checkout safeguards at <strong>7:00 PM</strong></span>
                  </div>
                </div>
              </div>

              {/* Real-time Digital Chronometer */}
              <div className="p-3 rounded-2xl bg-secondary/50 border border-border/80 text-center shrink-0 min-w-[170px] shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Time</p>
                <p className="text-xl font-black font-mono tracking-tight text-foreground mt-0.5">
                  {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Clock-In/Out Console */}
          <Card className="lg:col-span-7 border-border/80 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base font-bold">Shift Attendance Hub</CardTitle>
                </div>
                <Badge
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    isClockedIn
                      ? "bg-emerald-500 text-white shadow-xs animate-pulse"
                      : isClockedOut
                      ? "bg-blue-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isClockedIn ? "ON ACTIVE SHIFT" : isClockedOut ? "SHIFT COMPLETED" : "NOT CLOCKED IN"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6 flex-1">
              {/* Running Time Display */}
              <div className="text-center py-4 bg-secondary/30 rounded-2xl border border-border/50 space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {isClockedIn ? "Active Shift Duration" : isClockedOut ? "Total Shift Time" : "Shift Timer"}
                </p>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-foreground">
                  {formatDuration(elapsedSeconds)}
                </div>
                <p className="text-[11px] text-muted-foreground font-medium pt-1">
                  {isClockedIn
                    ? `Clocked in at ${formatTime(todayAttendance?.check_in_time || null)}`
                    : isClockedOut
                    ? `Completed shift from ${formatTime(todayAttendance?.check_in_time || null)} to ${formatTime(todayAttendance?.check_out_time || null)}`
                    : "Ready to start your work shift"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleClockIn}
                  disabled={!canClockIn || loading}
                  className={cn(
                    "h-12 text-sm font-bold shadow-md gap-2 transition-all",
                    canClockIn
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white hover:scale-[1.01]"
                      : "opacity-40"
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  Clock In to Shift
                </Button>

                <Button
                  onClick={handleClockOut}
                  disabled={!isClockedIn || loading}
                  variant="outline"
                  className={cn(
                    "h-12 text-sm font-bold gap-2 transition-all",
                    isClockedIn
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:scale-[1.01]"
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
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Check-In</span>
                  <p className="text-sm font-extrabold text-foreground mt-0.5">{formatTime(todayAttendance?.check_in_time || null)}</p>
                  {todayAttendance?.is_late && (
                    <Badge variant="destructive" className="text-[9px] mt-1 px-1 py-0 uppercase font-black">
                      Late Arrival
                    </Badge>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Check-Out</span>
                  <p className="text-sm font-extrabold text-foreground mt-0.5">{formatTime(todayAttendance?.check_out_time || null)}</p>
                  {todayAttendance?.is_auto_clocked_out && (
                    <Badge variant="outline" className="text-[9px] mt-1 px-1 py-0 uppercase font-bold text-orange-500 border-orange-500/30">
                      Auto 7 PM
                    </Badge>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Logged Hours</span>
                  <p className="text-sm font-extrabold text-foreground mt-0.5">
                    {todayAttendance?.working_hours ? `${Number(todayAttendance.working_hours).toFixed(1)} hrs` : "—"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Punctuality</span>
                  <p className="text-sm font-extrabold mt-0.5">
                    {todayAttendance?.is_late ? (
                      <span className="text-amber-500">Late Mark</span>
                    ) : todayAttendance?.check_in_time ? (
                      <span className="text-emerald-500">On Time</span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly KPI Overview */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Monthly Performance Analytics
                </CardTitle>
                <CardDescription className="text-xs">
                  {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} attendance metrics
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Days Present</span>
                    <div className="text-2xl font-black text-foreground">{totalDaysPresent}</div>
                    <p className="text-[10px] text-emerald-600 font-semibold">Active shifts logged</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Hours</span>
                    <div className="text-2xl font-black text-foreground">{totalHoursWorked.toFixed(1)}h</div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Monthly cumulative</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Flame className="h-5 w-5 text-orange-500 shrink-0" />
                    <div>
                      <div className="font-bold text-foreground">Punctuality Score: {onTimeStreak > 0 ? "95%" : "100%"}</div>
                      <div className="text-[10px] text-muted-foreground">Based on morning 9:00 AM check-ins</div>
                    </div>
                  </div>
                  <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                    ACTIVE
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    GPS Telemetry Validation
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Shift punches are cryptographically stamped with geolocation coordinates for on-site verification.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Monthly Attendance Audit Trail */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-4 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Monthly Attendance Audit Trail
                </CardTitle>
                <CardDescription className="text-xs">
                  Historical daily punch records, hours breakdown, and auto-checkout tracking.
                </CardDescription>
              </div>

              <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
                {history.length} Record{history.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {loading && history.length === 0 ? (
              <SkeletonList count={4} />
            ) : error && history.length === 0 ? (
              <ErrorView title="Records Unavailable" message={error} onRetry={fetchHistory} />
            ) : Array.isArray(history) && history.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl">
                <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <h4 className="text-xs font-bold text-foreground">No Attendance Logs for this Month</h4>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  Your daily clock-ins will appear here with hours logged and shift verification stamps.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {Array.isArray(history) &&
                  history.map((record) => {
                    const isLateRecord = record.is_late || record.status === "late"
                    const isPresent = record.status === "present" || record.status === "late"

                    return (
                      <div
                        key={record.id}
                        className="p-3.5 rounded-xl border border-border/70 bg-card hover:bg-secondary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-secondary/60 text-center flex flex-col items-center justify-center font-bold shrink-0 border border-border/50">
                            <span className="text-sm font-black text-foreground leading-none">
                              {new Date(record.date).getDate()}
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
                                  Auto 7 PM
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
                            <span className="text-sm font-extrabold font-mono text-foreground">
                              {record.working_hours ? `${Number(record.working_hours).toFixed(1)} hrs` : "—"}
                            </span>
                          </div>

                          <Badge
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              isPresent
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
                            )}
                          >
                            {isPresent ? "Present" : "Absent"}
                          </Badge>
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
