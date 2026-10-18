import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, MapPin, Play, Square, AlertCircle, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/apiClient"

interface ActiveRecord {
  id: number
  clockIn: string       // "HH:MM"
  date: string          // "YYYY-MM-DD"
  location: string | null
  status: string
  status_label?: string
  clock_in?: string | null
  check_in_time?: string | null
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

export function SmartClockInOut() {
  const [activeRecord, setActiveRecord] = useState<ActiveRecord | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [elapsedMs, setElapsedMs] = useState(0)
  const [loading, setLoading] = useState(true)   // initial fetch
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null) // 'Present' | 'Late' | 'Half Day'
  const [policy, setPolicy] = useState<AttendancePolicyView | null>(null)
  const [eligibility, setEligibility] = useState<ClockEligibility | null>(null)

  // ─── Tick every second ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ─── Recalculate elapsed when activeRecord or currentTime changes ──────
  useEffect(() => {
    if (activeRecord) {
      // Prefer the persisted instant, which is timezone-independent.
      const clockInDate = new Date(activeRecord.clock_in || `${activeRecord.date}T${activeRecord.clockIn}:00+05:30`)
      setElapsedMs(currentTime.getTime() - clockInDate.getTime())
    } else {
      setElapsedMs(0)
    }
  }, [activeRecord, currentTime])

  // ─── On mount: ask the backend if we have an open record today ─────────
  const fetchOpenRecord = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const [meResult, policyResult] = await Promise.allSettled([
        apiClient<any>("/api/attendance/me"),
        apiClient<any>("/api/attendance/policy"),
      ])
      if (meResult.status === "fulfilled") {
        const data = meResult.value
        if (data?.openRecord) {
          setActiveRecord(data.openRecord)
        } else {
          setActiveRecord(null)
        }
        const status = data?.today?.status
        setAttendanceStatus(status === "half_day" ? "Half Day" : status === "late" ? "Late" : status === "present" ? "Present" : null)
      } else {
        throw new Error(meResult.reason?.message || "Could not load attendance status")
      }
      if (policyResult.status === "fulfilled") {
        setPolicy(policyResult.value?.policy || null)
        setEligibility(policyResult.value?.eligibility || null)
      }
    } catch (err: any) {
      setError(err.message || "Could not load attendance status")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOpenRecord()
    const timer = setInterval(() => fetchOpenRecord(false), 30000)
    const onFocus = () => fetchOpenRecord(false)
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(timer); window.removeEventListener("focus", onFocus) }
  }, [fetchOpenRecord])

  // ─── Clock Out ──────────────────────────────────────────────────────────
  const handleClockOut = useCallback(async () => {
    setSubmitting(true)
    setError(null)
    try {
      await apiClient<any>("/api/attendance/clock-out", {
        method: "POST",
        body: JSON.stringify({}),
      })
      setActiveRecord(null)
      setElapsedMs(0)
      setAttendanceStatus(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("_clocked_in_date")
        window.dispatchEvent(new CustomEvent("attendance-status-changed"))
      }
      if (!notification) setNotification("Clocked out successfully.")
    } catch (err: any) {
      setError(err.message || "Failed to clock out")
    } finally {
      setSubmitting(false)
    }
  }, [notification])

  // ─── Get GPS location ───────────────────────────────────────────────────
  const getLocation = (): Promise<string> =>
    new Promise((resolve) => {
      if (navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
          () => resolve("Location unavailable"),
          { timeout: 4000, maximumAge: 60000 }
        )
      } else {
        resolve("GPS not supported")
      }
    })

  // ─── Clock In ───────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    setSubmitting(true)
    setError(null)
    setNotification(null)

    if (eligibility && !eligibility.allowed) {
      setError(eligibility.reason || "Clock-in is not permitted at this time under company shift policy.")
      setSubmitting(false)
      return
    }

    try {
      const location = await getLocation()
      const record = await apiClient<any>("/api/attendance/clock-in", {
        method: "POST",
        body: JSON.stringify({ location }),
      })
      const checkIn = record.check_in_time || record.clock_in
      const clockDate = new Date(checkIn)
      setActiveRecord({
        ...record,
        date: record.date || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(clockDate),
        clockIn: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(clockDate),
        clock_in: checkIn,
      })
      const label = record.status_label || (record.status === "half_day" ? "Half Day" : record.status === "late" ? "Late" : "Present")
      setAttendanceStatus(label)
      // Keep the employee-wide operation gate in sync with this clock surface.
      // The global gate uses this work-date marker for its fast verified path.
      if (typeof window !== "undefined") {
        const workDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(clockDate)
        localStorage.setItem("_clocked_in_date", workDate)
        window.dispatchEvent(new CustomEvent("attendance-status-changed"))
      }

      if (label === 'Half Day') {
        setNotification("Your attendance is marked Half Day by the company policy.")
      } else if (label === 'Late') {
        setNotification("Your attendance is marked Late by the company policy.")
      } else {
        setNotification("Clocked in successfully — you're on time! Have a great day! 🎉")
      }
    } catch (err: any) {
      setError(err.message || "Failed to clock in")
    } finally {
      setSubmitting(false)
    }
  }



  // ─── Formatting ─────────────────────────────────────────────────────────
  const formatElapsed = (ms: number) => {
    const totalSec = Math.max(Math.floor(ms / 1000), 0)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const timeStr = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
  })

  // ─── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Notifications / Errors */}
      {error && (
        <Alert className="rounded-xl border-destructive/25 bg-destructive/5 text-destructive">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
        </Alert>
      )}
      {notification && (
        <Alert className="rounded-xl border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-xs font-medium">{notification}</AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Clock className="h-4 w-4 text-primary" />
                Shift Attendance Hub
              </CardTitle>
              <CardDescription className="text-xs">
                {policy ? `Shift: ${policy.shiftStart}–${policy.shiftEnd} ${policy.timezone} · Cutoff: ${policy.clockInCutoff}` : "Attendance calculations are enforced by your company shift policy."}
              </CardDescription>
            </div>
            <Badge
              variant={activeRecord ? "default" : "outline"}
              className={activeRecord ? "bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-[11px]" : "font-semibold text-[11px]"}
            >
              {activeRecord ? "Shift in Progress" : "Shift Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Status bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/40 border border-border/60">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current State</span>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${activeRecord ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
                <span className="text-sm font-bold text-foreground">
                  {activeRecord ? "Clocked In & Active" : "Clocked Out"}
                </span>
              </div>
            </div>
            <div className="sm:text-right space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Local Time (Asia/Kolkata)</span>
              <p className="text-xl font-bold font-mono tabular-nums text-foreground">{timeStr}</p>
            </div>
          </div>

          {/* Clocked-in state */}
          {activeRecord ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Clock In Time</span>
                    <p className="text-base font-bold text-foreground tabular-nums mt-0.5">{activeRecord.clockIn}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Time Elapsed</span>
                    <p className="text-base font-bold font-mono tabular-nums text-primary mt-0.5">{formatElapsed(elapsedMs)}</p>
                  </div>
                </div>
                {attendanceStatus && (
                  <div className="pt-2 border-t border-primary/10 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Punctuality Grade</span>
                    <Badge
                      className={
                        attendanceStatus === "Present"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold text-[11px]"
                          : attendanceStatus === "Late"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold text-[11px]"
                          : "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30 font-semibold text-[11px]"
                      }
                      variant="outline"
                    >
                      {attendanceStatus}
                    </Badge>
                  </div>
                )}
              </div>

              {activeRecord.location && (
                <div className="p-3 flex items-start gap-2.5 bg-secondary/30 rounded-xl border border-border/50 text-xs">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-muted-foreground font-medium">Recorded Location</span>
                    <p className="font-semibold text-foreground truncate mt-0.5">{activeRecord.location}</p>
                  </div>
                </div>
              )}

              {policy?.automaticClockOutTime && (
                <p className="text-[11px] text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border/40">
                  Automatic system checkout is scheduled at <strong className="text-foreground">{policy.automaticClockOutTime}</strong> if not closed manually.
                </p>
              )}

              <Button
                onClick={handleClockOut}
                disabled={submitting}
                size="lg"
                className="w-full h-11 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-sm"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Square className="h-4 w-4 mr-2" />}
                {submitting ? "Signing off..." : "Clock Out & End Shift"}
              </Button>
            </div>
          ) : (
            /* Clocked-out state */
            <div className="space-y-3">
              {eligibility && !eligibility.allowed && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Shift Policy Notice: </span>
                    {eligibility.reason || "Clock-in is closed for this shift under company attendance policy."}
                  </div>
                </div>
              )}
              <Button
                onClick={handleClockIn}
                disabled={submitting || (eligibility ? !eligibility.allowed : false)}
                size="lg"
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {submitting
                  ? "Recording punch..."
                  : eligibility && !eligibility.allowed
                  ? "Shift Window Closed"
                  : "Clock In to Work"}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                {eligibility && !eligibility.allowed
                  ? (eligibility.reason || "Clock-in is not permitted at this time under company shift policy.")
                  : "Clicking Clock In records your timestamp and GPS coordinates (if permitted)."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
