"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, Play, Square, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useJobs } from "@/contexts/job-context"
import { apiClient } from "@/lib/apiClient"

interface ClockInOutProps {
  currentStatus: "clocked-out" | "clocked-in"
  currentLocation?: string
  currentJob?: string
  hoursToday: number
  onClockChange?: () => void // callback so dashboard can refresh stats
}

export function ClockInOut({ currentStatus, currentLocation, currentJob, hoursToday, onClockChange }: ClockInOutProps) {
  const { user } = useAuth()
  const { jobs } = useJobs()
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState(currentLocation || "")
  const [selectedJob, setSelectedJob] = useState(currentJob || "")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [error, setError] = useState<string | null>(null)

  // Sync prop changes (parent fetched real attendance)
  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getCurrentLocation = (): Promise<string> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            resolve(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          },
          () => {
            resolve("Location unavailable")
          },
          { timeout: 5000 }
        )
      } else {
        resolve("GPS not supported")
      }
    })
  }

  const handleClockAction = async () => {
    if (status === "clocked-out" && !selectedJob) {
      setError("Please select a job before clocking in")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (status === "clocked-out") {
        // Clock IN
        const gpsLocation = await getCurrentLocation()
        setLocation(gpsLocation)
        await apiClient("/api/attendance/clock-in", {
          method: "POST",
          body: JSON.stringify({ method: "manual" }),
        })
        setStatus("clocked-in")
      } else {
        // Clock OUT
        await apiClient("/api/attendance/clock-out", {
          method: "POST",
          body: JSON.stringify({ method: "manual" }),
        })
        setStatus("clocked-out")
      }

      // Notify parent to refresh stats
      onClockChange?.()
    } catch (err: any) {
      setError(err.message || "Failed to update time. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Get user's assigned active jobs from real job context
  const userJobs = jobs.filter((job: any) => {
    if (user?.role === "owner") return job.status === "active"
    const assigned = Array.isArray(job.assignedEmployees) ? job.assignedEmployees : []
    return assigned.some((a: any) => String(a) === String(user?.id)) && job.status === "active"
  })

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
        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Status</p>
            <div className="flex items-center gap-2">
              <Badge variant={status === "clocked-in" ? "default" : "secondary"}>
                {status === "clocked-in" ? "Clocked In" : "Clocked Out"}
              </Badge>
              <span className="text-sm text-muted-foreground font-mono">{getCurrentTime()}</span>
            </div>
          </div>
          <Button onClick={handleClockAction} disabled={isLoading} size="lg">
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

        {status === "clocked-out" && (
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
                  <SelectItem value="_none" disabled>No active jobs assigned</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {status === "clocked-in" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{location || "Location not available"}</span>
            </div>
            {selectedJob && (
              <div className="text-sm">
                <span className="text-muted-foreground">Working on: </span>
                <span className="font-medium">
                  {userJobs.find((job: any) => job.id === selectedJob)?.title || "Selected job"}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Hours Today</span>
            <span className="text-lg font-semibold">{hoursToday.toFixed(1)}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
