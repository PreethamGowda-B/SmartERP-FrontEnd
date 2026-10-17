"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  MapPin,
  Play,
  Square,
  Loader2,
  AlertTriangle,
  Timer,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck,
  Radio,
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { cn } from "@/lib/utils"
import { AttendanceStatus } from "@/components/attendance/attendance-ui"

interface ClockInOutProps {
  currentStatus: "clocked-out" | "clocked-in"
  currentLocation?: string
  hoursToday: number
  /** full attendance record from today so we can show late/auto-clock-out badges */
  attendanceRecord?: {
    is_late?: boolean
    is_auto_clocked_out?: boolean
    check_in_time?: string | null
    check_out_time?: string | null
    working_hours?: number | null
    status?: string | null
  } | null
  onClockChange?: () => void
}

type ClockEligibility = {
  allowed: boolean
  code?: string | null
  reason?: string | null
  is_late?: boolean
}

export function ClockInOut({
  currentStatus,
  currentLocation,
  hoursToday,
  attendanceRecord,
  onClockChange,
}: ClockInOutProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState(currentLocation || "")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [clockMsg, setClockMsg] = useState<{
    type: "ok" | "late" | "cutoff" | "early"
    message: string
  }>({
    type: "ok",
    message: "Verifying shift window...",
  })
  const [eligibility, setEligibility] = useState<ClockEligibility | null>(null)
  const [policySummary, setPolicySummary] = useState<{
    shiftStart: string
    shiftEnd: string
    clockInCutoff: string
    automaticClockOutTime: string
    timezone: string
  } | null>(null)

  // Sync prop status
  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  // Live second-by-second chronometer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate live elapsed seconds when currently on shift
  const elapsedSeconds = useMemo(() => {
    if (status === "clocked-in" && attendanceRecord?.check_in_time && !attendanceRecord?.check_out_time) {
      const checkInMs = new Date(attendanceRecord.check_in_time).getTime()
      return Math.max(0, Math.floor((currentTime.getTime() - checkInMs) / 1000))
    }
    if (attendanceRecord?.working_hours) {
      return Math.round(Number(attendanceRecord.working_hours) * 3600)
    }
    return Math.round(Number(hoursToday || 0) * 3600)
  }, [status, attendanceRecord, currentTime, hoursToday])

  const formatElapsed = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  // Fetch policy and eligibility
  const refreshPolicy = useCallback(async () => {
    try {
      const data = await apiClient<any>("/api/attendance/policy")
      setEligibility(data.eligibility)
      const policy = data.policy
      setPolicySummary(policy)

      if (data.eligibility?.allowed) {
        setClockMsg({
          type: data.eligibility.is_late ? "late" : "ok",
          message: data.eligibility.is_late
            ? `Late shift arrival window. Cutoff is ${policy.clockInCutoff}.`
            : `Clock-in open until ${policy.clockInCutoff}.`,
        })
      } else {
        const code = data.eligibility?.code
        setClockMsg({
          type: code === "too_early" ? "early" : "cutoff",
          message: data.eligibility?.reason || "Clock-in is currently unavailable for this shift.",
        })
      }
    } catch {
      setEligibility(null)
      setClockMsg({
        type: "cutoff",
        message: "Attendance service connected. Reconnecting policy...",
      })
    }
  }, [])

  useEffect(() => {
    refreshPolicy()
    const timer = setInterval(refreshPolicy, 30000)
    const onFocus = () => refreshPolicy()
    window.addEventListener("focus", onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", onFocus)
    }
  }, [refreshPolicy])

  const getCurrentLocation = (): Promise<string> =>
    new Promise((resolve) => {
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve(`GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`),
          () => resolve("Location capture skipped"),
          { timeout: 4000, maximumAge: 60000 }
        )
      } else {
        resolve("GPS not supported")
      }
    })

  const handleClockAction = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (status === "clocked-out") {
        const gpsLocation = await getCurrentLocation()
        setLocation(gpsLocation)
        await apiClient("/api/attendance/clock-in", {
          method: "POST",
          body: JSON.stringify({ method: "manual" }),
        })
        const saved = await apiClient<any>("/api/attendance/today")
        const isLate = Boolean(saved.is_late)
        setStatus("clocked-in")
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "_clocked_in_date",
            new Date().toLocaleDateString("en-CA", { timeZone: policySummary?.timezone || "Asia/Kolkata" })
          )
        }
        setSuccessMsg(isLate ? "Clocked in — logged as late arrival." : "Clocked in on time for today's shift.")
      } else {
        const saved = await apiClient<any>("/api/attendance/clock-out", {
          method: "POST",
          body: JSON.stringify({ method: "manual" }),
        })
        setStatus("clocked-out")
        if (typeof window !== "undefined") {
          localStorage.removeItem("_clocked_in_date")
        }
        setSuccessMsg(
          saved.is_auto_clocked_out
            ? "Shift automatically closed at company cutoff."
            : "Shift clocked out successfully. Thank you for your work!"
        )
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("attendance-status-changed"))
      }
      onClockChange?.()
    } catch (err: any) {
      setError(err.message || "Failed to update attendance. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isShiftComplete = Boolean(attendanceRecord?.check_in_time && attendanceRecord?.check_out_time)
  const isCurrentlyWorking = status === "clocked-in"
  const canClockIn = status === "clocked-out" && !isShiftComplete && eligibility?.allowed !== false

  const tz = policySummary?.timezone || "Asia/Kolkata"

  return (
    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card transition-all">
      {/* Card Header */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              isCurrentlyWorking
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : isShiftComplete
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}>
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                Today&apos;s Attendance
              </CardTitle>
              <CardDescription className="text-xs">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: tz,
                })}
              </CardDescription>
            </div>
          </div>

          {/* Live Chronometer */}
          <div className="text-right">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-muted-foreground block">
              {currentTime.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZone: tz,
              })}
            </span>
            <span className="text-[10px] text-muted-foreground/80 font-mono">
              {tz}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Status Indicator & Live Timer Bar */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3 sm:p-4 flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Current Shift State
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <AttendanceStatus
                status={
                  isCurrentlyWorking
                    ? "clocked-in"
                    : isShiftComplete
                    ? attendanceRecord?.status || "present"
                    : "incomplete"
                }
                isLate={attendanceRecord?.is_late}
              />
              {attendanceRecord?.is_auto_clocked_out && (
                <Badge variant="outline" className="text-[10px] py-0 border-blue-400 text-blue-700 dark:text-blue-300">
                  Auto-Closed
                </Badge>
              )}
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              {isCurrentlyWorking ? "Elapsed On Shift" : "Shift Hours"}
            </span>
            <span className={cn(
              "font-mono font-bold tracking-tight tabular-nums text-lg sm:text-xl",
              isCurrentlyWorking ? "text-blue-600 dark:text-blue-400" : "text-foreground"
            )}>
              {isCurrentlyWorking
                ? formatElapsed(elapsedSeconds)
                : hoursToday > 0
                ? `${hoursToday.toFixed(1)}h`
                : "—"}
            </span>
          </div>
        </div>

        {/* Policy Notice or Shift Window Warning */}
        {status === "clocked-out" && !attendanceRecord?.check_in_time && (
          <div
            className={cn(
              "flex items-start gap-2.5 p-3 rounded-xl text-xs border transition-all",
              clockMsg.type === "ok"
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                : clockMsg.type === "late"
                ? "bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                : "bg-rose-50/80 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300"
            )}
          >
            {clockMsg.type === "ok" ? (
              <Timer className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{clockMsg.message}</span>
          </div>
        )}

        {/* Action Button: Clock In / Clock Out */}
        <div>
          <Button
            onClick={handleClockAction}
            disabled={
              isLoading ||
              (status === "clocked-out" && (isShiftComplete || eligibility?.allowed === false))
            }
            className={cn(
              "w-full h-11 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all gap-2",
              isCurrentlyWorking
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Recording shift punch...</span>
              </>
            ) : isCurrentlyWorking ? (
              <>
                <Square className="h-4 w-4 fill-current" />
                <span>Clock Out for Today</span>
              </>
            ) : isShiftComplete ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Shift Completed for Today</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Clock In Now</span>
              </>
            )}
          </Button>
        </div>

        {/* Shift Timestamps Breakdown if clocked */}
        {attendanceRecord?.check_in_time && (
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground block">Check In</span>
              <span className="font-semibold text-foreground font-mono">
                {new Date(attendanceRecord.check_in_time).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: tz,
                })}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground block">Check Out</span>
              <span className="font-semibold text-foreground font-mono">
                {attendanceRecord.check_out_time
                  ? new Date(attendanceRecord.check_out_time).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: tz,
                    })
                  : "Active"}
              </span>
            </div>
          </div>
        )}

        {/* Location Telemetry note if clocked in */}
        {status === "clocked-in" && location && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs flex items-center justify-between gap-2">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Policy Footer */}
        <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground/80 leading-relaxed flex items-center justify-between">
          {policySummary ? (
            <span>
              Shift: <strong>{policySummary.shiftStart}–{policySummary.shiftEnd}</strong> · Cutoff: {policySummary.clockInCutoff}
            </span>
          ) : (
            <span>Standard company shift policy active.</span>
          )}
          <span className="font-mono text-[10px]">Auto-Out @ {policySummary?.automaticClockOutTime || "19:00"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
