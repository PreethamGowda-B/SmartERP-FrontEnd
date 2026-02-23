"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, Play, Square, Loader2, AlertTriangle, Timer } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useJobs } from "@/contexts/job-context"
import { apiClient } from "@/lib/apiClient"

interface ClockInOutProps {
  currentStatus: "clocked-out" | "clocked-in"
  currentLocation?: string
  currentJob?: string
  hoursToday: number
  /** full attendance record from today so we can show late/auto-clockout badges */
  attendanceRecord?: {
    is_late?: boolean
    is_auto_clocked_out?: boolean
    check_in_time?: string | null
    check_out_time?: string | null
  } | null
  onClockChange?: () => void
}

// Returns a descriptive message based on current time and clock-in rules
function getClockStatusMessage(): { type: "ok" | "late" | "cutoff" | "early"; message: string } {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()

  if (h < 9) {
    const minsLeft = (9 - h) * 60 - m
    return {
      type: "early",
      message: `⏳ Clock-in opens at 9:00 AM. ${minsLeft} min remaining.`,
    }
  }
  if (h === 9 && m === 0) {
    return { type: "ok", message: "🟢 Right on time! Shift starts now." }
  }
  if (h < 11 || (h === 11 && m === 0)) {
    return { type: "late", message: "🟡 You're late — clock in before 11:00 AM to avoid being marked absent." }
  }
  // after 11:00 AM
  return { type: "cutoff", message: "🔴 Clock-in window closed (11:00 AM). Come tomorrow and clock in early." }
}

export function ClockInOut({
  currentStatus,
  currentLocation,
  currentJob,
  hoursToday,
  attendanceRecord,
  onClockChange,
}: ClockInOutProps) {
  const { user } = useAuth()
  const { jobs } = useJobs()
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState(currentLocation || "")
  const [selectedJob, setSelectedJob] = useState(currentJob || "")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [clockMsg, setClockMsg] = useState(getClockStatusMessage())

  // Sync prop status (parent re-fetched real attendance)
  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      setClockMsg(getClockStatusMessage())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getCurrentLocation = (): Promise<string> =>
    new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve(`GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`),
          () => resolve("Location unavailable"),
          { timeout: 5000 }
        )
      } else {
        resolve("GPS not supported")
      }
    })

  const handleClockAction = async () => {
    if (status === "clocked-out" && !selectedJob) {
      setError("Please select a job before clocking in")
      return
    }

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
        const isLate = getClockStatusMessage().type === "late"
        setStatus("clocked-in")
        setSuccessMsg(isLate ? "✅ Clocked in — marked as late." : "✅ Clocked in on time!")
      } else {
        await apiClient("/api/attendance/clock-out", {
          method: "POST",
          body: JSON.stringify({ method: "manual" }),
        })
        setStatus("clocked-out")
        setSuccessMsg("✅ Clocked out successfully. See you tomorrow!")
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
    })

  // Get user's assigned active jobs from real job context
  const userJobs = jobs.filter((job: any) => {
    if (user?.role === "owner") return job.status === "active"
    const assigned = Array.isArray(job.assignedEmployees) ? job.assignedEmployees : []
    return assigned.some((a: any) => String(a) === String(user?.id)) && job.status === "active"
  })

  const isCutoffPassed = clockMsg.type === "cutoff"
  const isEarly = clockMsg.type === "early"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracking
        </CardTitle>
        <CardDescription>Clock in/out and track your work hours with GPS location</CardDescription>
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
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <Timer className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{clockMsg.message}</span>
          </div>
        )}

        {/* Error from backend */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Status</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={status === "clocked-in" ? "default" : "secondary"}>
                {status === "clocked-in" ? "Clocked In" : "Clocked Out"}
              </Badge>
              {attendanceRecord?.is_late && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                  ⚠ Late
                </Badge>
              )}
              {attendanceRecord?.is_auto_clocked_out && (
                <Badge variant="outline" className="border-blue-400 text-blue-700 dark:text-blue-400">
                  🤖 Auto Clock-Out (7 PM)
                </Badge>
              )}
              <span className="text-sm text-muted-foreground font-mono">{getCurrentTime()}</span>
            </div>
          </div>
          <Button
            onClick={handleClockAction}
            disabled={isLoading || isCutoffPassed || isEarly || (status === "clocked-out" && !!attendanceRecord?.check_out_time)}
            size="lg"
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
            <p>🕘 In: {new Date(attendanceRecord.check_in_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
            <p>🕖 Out: {new Date(attendanceRecord.check_out_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
            {attendanceRecord.is_auto_clocked_out && (
              <p className="text-blue-600 dark:text-blue-400 text-xs">You were automatically clocked out at 7:00 PM.</p>
            )}
          </div>
        )}

        {/* Job selector (only when not clocked in and no completed record) */}
        {status === "clocked-out" && !attendanceRecord?.check_out_time && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Job to Work On</label>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job..." />
              </SelectTrigger>
              <SelectContent>
                {userJobs.length > 0 ? (
                  userJobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}{job.client ? ` - ${job.client}` : ""}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="_none" disabled>
                    No active jobs assigned
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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
          Shift: <strong>9:00 AM – 7:00 PM</strong> · Late window: 9:01–11:00 AM · After 11:00 AM = absent for today · Auto clock-out at 7:00 PM
        </div>
      </CardContent>
    </Card>
  )
}
