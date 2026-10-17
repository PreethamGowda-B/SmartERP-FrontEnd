"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Play, Square, Loader2, AlertTriangle, Timer } from "lucide-react"
import { apiClient } from "@/lib/apiClient"

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
  } | null
  onClockChange?: () => void
}

type ClockEligibility = { allowed: boolean; code?: string | null; reason?: string | null; is_late?: boolean }

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
  const [clockMsg, setClockMsg] = useState<{ type: "ok" | "late" | "cutoff" | "early"; message: string }>({ type: "ok", message: "Checking attendance policy…" })
  const [eligibility, setEligibility] = useState<ClockEligibility | null>(null)
  const [policySummary, setPolicySummary] = useState<{ shiftStart: string; shiftEnd: string; clockInCutoff: string; automaticClockOutTime: string } | null>(null)

  // Sync prop status (parent re-fetched real attendance)
  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await apiClient<any>("/api/attendance/policy")
        setEligibility(data.eligibility)
        const policy = data.policy
        setPolicySummary(policy)
        if (data.eligibility?.allowed) {
          setClockMsg({ type: data.eligibility.is_late ? "late" : "ok", message: data.eligibility.is_late ? `Late clock-in window. Please clock in before ${policy.clockInCutoff}.` : `Clock-in is open until ${policy.clockInCutoff}.` })
        } else {
          const code = data.eligibility?.code
          setClockMsg({ type: code === "too_early" ? "early" : "cutoff", message: data.eligibility?.reason || "Clock-in is unavailable." })
        }
      } catch {
        setEligibility(null)
        setClockMsg({ type: "cutoff", message: "Could not verify attendance policy. Refresh or try again." })
      }
    }
    refresh()
    const timer = setInterval(refresh, 30000)
    const onFocus = () => refresh()
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(timer); window.removeEventListener("focus", onFocus) }
  }, [])

  const getCurrentLocation = (): Promise<string> =>
    new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve(`GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`),
          () => resolve("Location unavailable"),
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
          localStorage.setItem("_clocked_in_date", new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }))
        }
        setSuccessMsg(isLate ? "✅ Clocked in — marked as late." : "✅ Clocked in on time!")
      } else {
        const saved = await apiClient<any>("/api/attendance/clock-out", {
          method: "POST",
          body: JSON.stringify({ method: "manual" }),
        })
        setStatus("clocked-out")
        if (typeof window !== "undefined") {
          localStorage.removeItem("_clocked_in_date")
        }
        setSuccessMsg(saved.is_auto_clocked_out ? "✅ Shift closed automatically at the company cutoff." : "✅ Clocked out successfully. See you tomorrow!")
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("attendance-status-changed"))
      }
      onClockChange?.()
    } catch (err: any) {
      // Use the backend message directly — it's already user-friendly
      setError(err.message || "Failed to update. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentTime = () =>
    currentTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/[0.06] via-transparent to-emerald-500/[0.04] pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Clock className="h-5 w-5" /></span>
          Today’s attendance
        </CardTitle>
        <CardDescription>One live view of your saved shift and the company clock-in window.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Attendance window hint banner (only shown when not yet clocked in) */}
        {status === "clocked-out" && !attendanceRecord?.check_in_time && (
          <div
            className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm border ${clockMsg.type === "ok"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              : clockMsg.type === "late"
                ? "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                : clockMsg.type === "cutoff"
                  ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                  : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
              }`}
          >
            {clockMsg.type === "cutoff" || clockMsg.type === "late" ? (
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <Timer className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span>{clockMsg.message}</span>
          </div>
        )}

        {/* Error from backend */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg px-3 py-2">
            {successMsg}
          </div>
        )}

        {/* Status + Clock In/Out button */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Status</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={status === "clocked-in" ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" : ""} variant={status === "clocked-in" ? "outline" : "secondary"}>
                {status === "clocked-in" ? "Working now" : attendanceRecord?.check_out_time ? "Shift completed" : "Not clocked in"}
              </Badge>
              {attendanceRecord?.is_late && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                  ⚠ Late
                </Badge>
              )}
              {attendanceRecord?.is_auto_clocked_out && (
                <Badge variant="outline" className="border-blue-400 text-blue-700 dark:text-blue-400">
                  🤖 Auto Clock-Out ({policySummary?.automaticClockOutTime || "scheduled"})
                </Badge>
              )}
              <span className="text-sm text-muted-foreground font-mono tabular-nums">IST · {getCurrentTime()}</span>
            </div>
            {attendanceRecord?.check_in_time && <p className="pt-1 text-xs text-muted-foreground">Started {new Date(attendanceRecord.check_in_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}{status === "clocked-in" ? ` · ${formatDuration(Math.max(0, currentTime.getTime() - new Date(attendanceRecord.check_in_time).getTime()))} elapsed` : ""}</p>}
          </div>
          <Button
            onClick={handleClockAction}
            disabled={isLoading || (status === "clocked-out" && (!eligibility?.allowed || !!attendanceRecord?.check_out_time))}
            size="lg"
            className="min-h-12 w-full rounded-xl px-6 text-base font-semibold sm:w-auto"
            variant={status === "clocked-in" ? "destructive" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : status === "clocked-out" ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Clock In
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Clock Out
              </>
            )}
          </Button>
        </div>

        {/* Already clocked in and out for today */}
        {attendanceRecord?.check_in_time && attendanceRecord?.check_out_time && (
          <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 space-y-1">
            <p className="font-medium text-foreground">Today's shift complete</p>
            <p>🕘 In: {new Date(attendanceRecord.check_in_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}</p>
            <p>🕖 Out: {new Date(attendanceRecord.check_out_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}</p>
            {attendanceRecord.is_auto_clocked_out && (
              <p className="text-blue-600 dark:text-blue-400 text-xs">You were automatically clocked out at the company cutoff.</p>
            )}
          </div>
        )}


        {/* Location when clocked in */}
        {status === "clocked-in" && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{location || "Location not captured"}</span>
          </div>
        )}

        {/* Hours Today */}
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Hours Today</span>
            <span className="text-lg font-semibold">{hoursToday > 0 ? `${hoursToday.toFixed(1)}h` : "—"}</span>
          </div>
        </div>

        {/* Attendance rules reminder */}
        <div className="text-xs text-muted-foreground/70 pt-1 leading-relaxed">
          {policySummary ? <>Shift: <strong>{policySummary.shiftStart}–{policySummary.shiftEnd}</strong> · Clock-in cutoff: {policySummary.clockInCutoff} · Auto clock-out: {policySummary.automaticClockOutTime}</> : "Loading company attendance policy…"}
        </div>
      </CardContent>
    </Card>
  )
}

function formatDuration(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60000)
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`
}
