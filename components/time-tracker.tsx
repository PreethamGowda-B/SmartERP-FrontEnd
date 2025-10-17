"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockJobs } from "@/lib/data"
import { useAuth } from "@/contexts/auth-context"
import { Clock, MapPin, Play, Square, Pause } from "lucide-react"

interface TimeSession {
  startTime: Date
  jobId: string
  location: string
}

export function TimeTracker() {
  const { user } = useAuth()
  const [isTracking, setIsTracking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentSession, setCurrentSession] = useState<TimeSession | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedJob, setSelectedJob] = useState("")
  const [currentLocation, setCurrentLocation] = useState("Getting location...")

  // Get user's assigned jobs
  const assignedJobs = mockJobs.filter(
    (job) => job.assignedEmployees.includes(user?.id || "") && job.status === "active",
  )

  // Mock location detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Mock reverse geocoding
          setCurrentLocation("Downtown Office Complex, 123 Main St")
        },
        () => {
          setCurrentLocation("Location unavailable")
        },
      )
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTracking && !isPaused && currentSession) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - currentSession.startTime.getTime())
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, isPaused, currentSession])

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleStartTracking = () => {
    if (!selectedJob) return

    const session: TimeSession = {
      startTime: new Date(),
      jobId: selectedJob,
      location: currentLocation,
    }

    setCurrentSession(session)
    setIsTracking(true)
    setIsPaused(false)
    setElapsedTime(0)
  }

  const handlePauseResume = () => {
    setIsPaused(!isPaused)
  }

  const handleStopTracking = () => {
    if (currentSession) {
      // Here you would save the time entry to the database
      const totalHours = elapsedTime / (1000 * 60 * 60)
      console.log(`Time entry saved: ${totalHours.toFixed(2)} hours for job ${currentSession.jobId}`)
    }

    setIsTracking(false)
    setIsPaused(false)
    setCurrentSession(null)
    setElapsedTime(0)
    setSelectedJob("")
  }

  const selectedJobDetails = assignedJobs.find((job) => job.id === selectedJob)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracker
        </CardTitle>
        <CardDescription>Track time spent on specific jobs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isTracking ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Job</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job to track time for" />
                </SelectTrigger>
                <SelectContent>
                  {assignedJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} - {job.client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{currentLocation}</span>
            </div>

            <Button onClick={handleStartTracking} disabled={!selectedJob} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="text-3xl font-mono font-bold">{formatTime(elapsedTime)}</div>
              <Badge variant={isPaused ? "secondary" : "default"}>{isPaused ? "Paused" : "Tracking"}</Badge>
            </div>

            {selectedJobDetails && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedJobDetails.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedJobDetails.client}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{currentSession?.location}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePauseResume} className="flex-1 bg-transparent">
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button variant="destructive" onClick={handleStopTracking} className="flex-1">
                <Square className="h-4 w-4 mr-2" />
                Stop & Save
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
