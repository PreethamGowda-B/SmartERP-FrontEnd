"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, MapPin, Play, Square, AlertCircle, Loader2 } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

interface ActiveRecord {
  id: number
  clockIn: string       // "HH:MM"
  date: string          // "YYYY-MM-DD"
  location: string | null
  status: string
}

export function SmartClockInOut() {
  const [activeRecord, setActiveRecord] = useState<ActiveRecord | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [elapsedMs, setElapsedMs] = useState(0)
  const [loading, setLoading] = useState(true)   // initial fetch
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // ─── Tick every second ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ─── Recalculate elapsed when activeRecord or currentTime changes ──────
  useEffect(() => {
    if (activeRecord) {
      // Parse the HH:MM clock-in time and combine with the record's date
      const [h, m] = activeRecord.clockIn.split(":").map(Number)
      const clockInDate = new Date(activeRecord.date + "T" + activeRecord.clockIn + ":00")
      setElapsedMs(currentTime.getTime() - clockInDate.getTime())
    } else {
      setElapsedMs(0)
    }
  }, [activeRecord, currentTime])

  // ─── On mount: ask the backend if we have an open record today ─────────
  const fetchOpenRecord = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/attendance/me`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to check attendance")
      const data = await res.json()
      if (data.openRecord) {
        setActiveRecord(data.openRecord)
      } else {
        setActiveRecord(null)
      }
    } catch (err: any) {
      setError(err.message || "Could not load attendance status")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOpenRecord()
  }, [fetchOpenRecord])

  // ─── Auto clock-out at 7 PM ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeRecord) return
    if (currentTime.getHours() >= 19) {
      // Trigger clock-out automatically
      setNotification("You have been automatically clocked out at 7:00 PM")
      handleClockOut()
    }
  }, [currentTime, activeRecord])

  // ─── Get GPS location ───────────────────────────────────────────────────
  const getLocation = (): Promise<string> =>
    new Promise((resolve) => {
      if (navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
          () => resolve("Location unavailable"),
          { timeout: 5000 }
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
    try {
      const location = await getLocation()
      const res = await fetch(`${API}/api/attendance/clock-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ location }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || `Clock-in failed (${res.status})`)
      }
      const record = await res.json()
      setActiveRecord(record)

      // Tell the employee whether they are on-time or late
      const now = new Date()
      if (now.getHours() >= 9) {
        setNotification("You clocked in after 9:00 AM — this will be marked as Late.")
      } else {
        setNotification("Clocked in successfully. Have a great day!")
      }
    } catch (err: any) {
      setError(err.message || "Failed to clock in")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Clock Out ──────────────────────────────────────────────────────────
  const handleClockOut = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/attendance/clock-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}), // backend auto-finds today's open record
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || `Clock-out failed (${res.status})`)
      }
      setActiveRecord(null)
      setElapsedMs(0)
      if (!notification) setNotification("Clocked out successfully.")
    } catch (err: any) {
      setError(err.message || "Failed to clock out")
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

  const timeStr = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
  })

  // ─── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Notifications / Errors */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      {notification && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">{notification}</AlertDescription>
        </Alert>
      )}

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Smart Clock In/Out
          </CardTitle>
          <CardDescription>
            Clock in before 9:00 AM to mark as Present. Auto clock-out at 7:00 PM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status bar */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={activeRecord ? "default" : "secondary"} className="text-base py-1">
                {activeRecord ? "Clocked In" : "Clocked Out"}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Current Time</p>
              <p className="text-2xl font-bold font-mono">{timeStr}</p>
            </div>
          </div>

          {/* Clocked-in state */}
          {activeRecord ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Clock In Time</p>
                    <p className="text-lg font-semibold">{activeRecord.clockIn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Elapsed</p>
                    <p className="text-lg font-semibold font-mono text-blue-600">{formatElapsed(elapsedMs)}</p>
                  </div>
                </div>
              </div>

              {activeRecord.location && (
                <div className="p-3 flex items-start gap-2 bg-muted rounded-lg">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{activeRecord.location}</p>
                  </div>
                </div>
              )}

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  You will be automatically clocked out at <strong>7:00 PM</strong>
                </p>
              </div>

              <Button onClick={handleClockOut} disabled={submitting} size="lg" className="w-full" variant="destructive">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Square className="h-4 w-4 mr-2" />}
                {submitting ? "Clocking out..." : "Clock Out"}
              </Button>
            </div>
          ) : (
            /* Clocked-out state */
            <Button
              onClick={handleClockIn}
              disabled={submitting}
              size="lg"
              className="w-full bg-gradient-to-r from-accent to-primary"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {submitting ? "Clocking in..." : "Clock In"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
