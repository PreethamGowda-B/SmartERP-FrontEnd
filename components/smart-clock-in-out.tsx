"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, MapPin, Play, Square, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ClockSession {
  clockInTime: Date | null
  clockOutTime: Date | null
  totalHours: number
  location: string
  status: "clocked-in" | "clocked-out"
}

export function SmartClockInOut() {
  const { user } = useAuth()
  const [session, setSession] = useState<ClockSession>({
    clockInTime: null,
    clockOutTime: null,
    totalHours: 0,
    location: "",
    status: "clocked-out",
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto clock-out at 7:00 PM
  useEffect(() => {
    if (session.status === "clocked-in" && session.clockInTime) {
      const checkAutoClockOut = setInterval(() => {
        const now = new Date()
        if (now.getHours() >= 19 && now.getMinutes() >= 0) {
          handleAutoClockOut()
          clearInterval(checkAutoClockOut)
        }
      }, 60000) // Check every minute

      return () => clearInterval(checkAutoClockOut)
    }
  }, [session.status, session.clockInTime])

  // Check for missing clock-in notification at 10:00 AM
  useEffect(() => {
    const checkMissingClockIn = setInterval(() => {
      const now = new Date()
      if (now.getHours() === 10 && now.getMinutes() === 0 && session.status === "clocked-out") {
        setNotificationMessage("You haven't clocked in yet. Please clock in to start your workday.")
        setShowNotification(true)
      }
    }, 60000)

    return () => clearInterval(checkMissingClockIn)
  }, [session.status])

  // Calculate elapsed time
  useEffect(() => {
    if (session.status === "clocked-in" && session.clockInTime) {
      const timer = setInterval(() => {
        const elapsed = Date.now() - session.clockInTime.getTime()
        setElapsedTime(elapsed)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [session.status, session.clockInTime])

  const getCurrentLocation = (): Promise<string> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            resolve(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          },
          () => resolve("Location unavailable"),
        )
      } else {
        resolve("GPS not supported")
      }
    })
  }

  const handleClockIn = async () => {
    setIsLoading(true)
    try {
      const location = await getCurrentLocation()
      const clockInTime = new Date()

      setSession({
        clockInTime,
        clockOutTime: null,
        totalHours: 0,
        location,
        status: "clocked-in",
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      alert("Failed to clock in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockOut = async () => {
    setIsLoading(true)
    try {
      const clockOutTime = new Date()
      const totalHours = (clockOutTime.getTime() - session.clockInTime!.getTime()) / (1000 * 60 * 60)

      setSession({
        ...session,
        clockOutTime,
        totalHours: Math.round(totalHours * 100) / 100,
        status: "clocked-out",
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      alert("Failed to clock out. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoClockOut = async () => {
    const clockOutTime = new Date()
    clockOutTime.setHours(19, 0, 0)
    const totalHours = (clockOutTime.getTime() - session.clockInTime!.getTime()) / (1000 * 60 * 60)

    setSession({
      ...session,
      clockOutTime,
      totalHours: Math.round(totalHours * 100) / 100,
      status: "clocked-out",
    })

    setNotificationMessage("You have been automatically clocked out at 7:00 PM")
    setShowNotification(true)
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {showNotification && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">{notificationMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Smart Clock In/Out
          </CardTitle>
          <CardDescription>Automatic clock-out at 7:00 PM with live tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and Time Display */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={session.status === "clocked-in" ? "default" : "secondary"} className="text-base py-1">
                {session.status === "clocked-in" ? "Clocked In" : "Clocked Out"}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Current Time</p>
              <p className="text-2xl font-bold font-mono">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
          </div>

          {/* Clock In Details */}
          {session.status === "clocked-in" ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Clock In Time</p>
                    <p className="text-lg font-semibold">
                      {session.clockInTime?.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Elapsed</p>
                    <p className="text-lg font-semibold font-mono text-blue-600">{formatTime(elapsedTime)}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 flex items-start gap-2 bg-muted rounded-lg">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{session.location || "Fetching..."}</p>
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  You will be automatically clocked out at <strong>7:00 PM</strong>
                </p>
              </div>

              <Button onClick={handleClockOut} disabled={isLoading} size="lg" className="w-full" variant="destructive">
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Clock Out
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleClockIn}
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-accent to-primary"
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Clock In
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
