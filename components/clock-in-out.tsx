"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, Play, Square, Loader2 } from "lucide-react"
import { mockJobs } from "@/lib/data"
import { useAuth } from "@/contexts/auth-context"

interface ClockInOutProps {
  currentStatus: "clocked-out" | "clocked-in"
  currentLocation?: string
  currentJob?: string
  hoursToday: number
}

export function ClockInOut({ currentStatus, currentLocation, currentJob, hoursToday }: ClockInOutProps) {
  const { user } = useAuth()
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState(currentLocation || "")
  const [selectedJob, setSelectedJob] = useState(currentJob || "")
  const [currentTime, setCurrentTime] = useState(new Date())

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
            // In a real app, you'd reverse geocode these coordinates
            resolve(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          },
          () => {
            resolve("Location unavailable")
          },
        )
      } else {
        resolve("GPS not supported")
      }
    })
  }

  const handleClockAction = async () => {
    if (status === "clocked-out" && !selectedJob) {
      alert("Please select a job before clocking in")
      return
    }

    setIsLoading(true)

    try {
      if (status === "clocked-out") {
        const gpsLocation = await getCurrentLocation()
        setLocation(gpsLocation)
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newStatus = status === "clocked-out" ? "clocked-in" : "clocked-out"
      setStatus(newStatus)

      const action = newStatus === "clocked-in" ? "clocked in" : "clocked out"
    } catch (error) {
      alert("Failed to update time. Please try again.")
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

  // Get user's assigned jobs
  const userJobs =
    user?.role === "owner"
      ? mockJobs.filter((job) => job.status === "active")
      : mockJobs.filter((job) => job.assignedEmployees.includes(user?.id || "") && job.status === "active")

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
                {userJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} - {job.client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {status === "clocked-in" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{location || "Fetching location..."}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Working on: </span>
              <span className="font-medium">
                {userJobs.find((job) => job.id === selectedJob)?.title || "No job selected"}
              </span>
            </div>
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
