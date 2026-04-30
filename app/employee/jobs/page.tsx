"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useJobs } from "@/contexts/job-context"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Calendar, Users, Briefcase, Clock, CheckCircle2, AlertCircle,
  XCircle, ThumbsUp, ThumbsDown, RefreshCw,
} from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
const AUTO_REFRESH_MS = 30_000

import { getAccessToken } from "@/lib/apiClient"
function jobAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (token) h["Authorization"] = `Bearer ${token}`
  return h
}

function getStatusIcon(status?: string) {
  switch (status?.toLowerCase() || "pending") {
    case "completed": return <CheckCircle2 className="w-4 h-4 text-green-600" />
    case "active":
    case "in progress": return <Clock className="w-4 h-4 text-blue-600" />
    case "pending": return <AlertCircle className="w-4 h-4 text-yellow-600" />
    default: return null
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return "Date unknown"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    })
  } catch {
    return "Date unknown"
  }
}

function formatLastUpdated(date: Date | null) {
  if (!date) return "Never"
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export default function EmployeeJobsPage() {
  const { jobs, refreshJobs } = useJobs()
  const { user: currentUser } = useAuth()
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)
  const [progressValues, setProgressValues] = useState<Record<string, number>>({})
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isRefreshingRef = useRef(false)

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      await refreshJobs()
      setLastUpdated(new Date())
    } finally {
      setIsRefreshing(false)
      isRefreshingRef.current = false
    }
  }, [refreshJobs])

  // Initial fetch + 30-second auto-refresh
  useEffect(() => {
    handleRefresh()
    const intervalId = setInterval(handleRefresh, AUTO_REFRESH_MS)
    return () => clearInterval(intervalId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh immediately when a push notification arrives (new job assigned)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data
        if (data?.type === "job" || data?.type === "job_assigned" || data?.type === "new_job") {
          handleRefresh()
        }
      } catch { /* ignore */ }
    }
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handler)
      return () => navigator.serviceWorker.removeEventListener("message", handler)
    }
  }, [handleRefresh])

  const handleAcceptJob = async (jobId: string) => {
    setUpdatingJobId(jobId)
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/accept`, {
        method: "POST",
        credentials: "include",
        headers: jobAuthHeaders(),
      })
      if (res.ok) {
        showNotification("success", "Job accepted successfully!")
        await refreshJobs()
        setLastUpdated(new Date())
      } else {
        const body = await res.json().catch(() => ({}))
        // On 409, refresh immediately so stale job state is cleared
        if (res.status === 409) {
          await refreshJobs()
          setLastUpdated(new Date())
        }
        showNotification("error", body?.message || "Failed to accept job. Please try again.")
      }
    } catch {
      showNotification("error", "Failed to accept job. Please try again.")
    } finally {
      setUpdatingJobId(null)
    }
  }

  const handleDeclineJob = async (jobId: string) => {
    setUpdatingJobId(jobId)
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/decline`, {
        method: "POST",
        credentials: "include",
        headers: jobAuthHeaders(),
      })
      if (res.ok) {
        showNotification("success", "Job declined.")
        await refreshJobs()
        setLastUpdated(new Date())
      } else {
        const body = await res.json().catch(() => ({}))
        showNotification("error", body?.message || "Failed to decline job. Please try again.")
      }
    } catch {
      showNotification("error", "Failed to decline job. Please try again.")
    } finally {
      setUpdatingJobId(null)
    }
  }

  const handleProgressUpdate = async (jobId: string, progress: number) => {
    setUpdatingJobId(jobId)
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/progress`, {
        method: "POST",
        credentials: "include",
        headers: jobAuthHeaders(),
        body: JSON.stringify({ progress }),
      })
      if (res.ok) {
        showNotification("success", `Progress updated to ${progress}%`)
        await refreshJobs()
        setLastUpdated(new Date())
      } else {
        const body = await res.json().catch(() => ({}))
        showNotification("error", body?.message || "Failed to update progress. Please try again.")
      }
    } catch {
      showNotification("error", "Failed to update progress. Please try again.")
    } finally {
      setUpdatingJobId(null)
    }
  }

  if (jobs.length === 0) {
    return (
      <EmployeeLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
          <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Available Jobs
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">Browse and manage your assigned construction projects</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
            <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-2xl">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Briefcase className="w-20 h-20 text-indigo-400 mb-6" />
                <p className="text-2xl font-semibold text-gray-700">No jobs available yet</p>
                <p className="text-base text-gray-500 mt-3">New projects will appear here when assigned</p>
                <p className="text-xs text-muted-foreground mt-4">Last updated: {formatLastUpdated(lastUpdated)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="p-8 max-w-7xl mx-auto">

          {/* Toast Notification */}
          {notification && (
            <div
              className={cn(
                "fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl backdrop-blur-sm animate-in slide-in-from-right duration-300",
                notification.type === "success"
                  ? "bg-green-500/90 text-white border border-green-400"
                  : "bg-red-500/90 text-white border border-red-400"
              )}
            >
              {notification.message}
            </div>
          )}

          {/* Header */}
          <div className="mb-10 relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl" />
            <div className="absolute -top-8 right-20 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl" />

            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Available Jobs
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Browse and manage your assigned construction projects
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2 bg-white/70 backdrop-blur-sm"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "Refreshing…" : "Refresh"}
                </Button>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated: {formatLastUpdated(lastUpdated)}
                </span>
              </div>
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
              const status = job.status || "pending"
              const employeeStatus = job.employee_status || "pending"
              const progress = progressValues[job.id] ?? (job.progress || 0)
              const createdDate = job.created_at || job.createdAt
              const isVisibleToAll = job.visible_to_all || false
              const assignedEmployees = job.assignedEmployees || []

              const isPending = (employeeStatus as string) === "pending" || (employeeStatus as string) === "assigned"
              const isAccepted = employeeStatus === "accepted"
              const isDeclined = employeeStatus === "declined"
              const isCompleted = status?.toLowerCase() === "completed"
              const assignedEmployeeName = (job as any).assigned_employee_name
              // Job accepted by someone else — show their name, hide Accept/Decline
              const acceptedByOther = isAccepted && (job as any).assigned_to && String((job as any).assigned_to) !== String(currentUser?.id)

              return (
                <Card
                  key={job.id}
                  className={cn(
                    "group relative overflow-hidden border-0 transition-all duration-500 hover:scale-[1.02]",
                    isAccepted && "bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-xl shadow-xl shadow-blue-200/50",
                    isDeclined && "opacity-60 bg-gradient-to-br from-red-50/60 to-pink-50/60 backdrop-blur-xl",
                    isPending && "bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:shadow-purple-200/50",
                    isCompleted && "bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-xl shadow-xl shadow-green-200/50"
                  )}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />

                  {/* Top color bar */}
                  <div className={cn(
                    "h-2 w-full relative",
                    isCompleted && "bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 shadow-lg shadow-green-500/50",
                    isAccepted && !isCompleted && "bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/50",
                    isPending && "bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 shadow-lg shadow-yellow-500/50",
                    isDeclined && "bg-gradient-to-r from-red-400 via-pink-500 to-rose-500 shadow-lg shadow-red-500/50"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>

                  <CardHeader className="space-y-3 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusIcon(status)}
                          <Badge variant={status === "completed" ? "default" : "outline"} className="font-semibold">
                            {status}
                          </Badge>
                          {isAccepted && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <ThumbsUp className="w-3 h-3 mr-1" />Accepted
                            </Badge>
                          )}
                          {isDeclined && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <XCircle className="w-3 h-3 mr-1" />Declined
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {job.title}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-sm line-clamp-3 leading-relaxed">
                      {job.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress — accepted jobs only */}
                    {isAccepted && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-muted-foreground">Progress</span>
                          <span className="font-bold text-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2.5 bg-secondary" />
                        {!isCompleted && (
                          <div className="space-y-2 pt-2">
                            <label className="text-xs font-medium text-muted-foreground">Update Progress</label>
                            <Slider
                              value={[progress]}
                              onValueChange={(v) => setProgressValues({ ...progressValues, [job.id]: v[0] })}
                              max={100}
                              step={10}
                              className="cursor-pointer"
                              disabled={updatingJobId === job.id}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>0%</span><span>50%</span><span>100%</span>
                            </div>
                            {progress !== (job.progress || 0) && (
                              <Button
                                size="sm"
                                onClick={() => handleProgressUpdate(job.id, progress)}
                                disabled={updatingJobId === job.id}
                                className="w-full mt-2"
                              >
                                {updatingJobId === job.id ? "Updating…" : "Save Progress"}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Job Details */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3">
                        <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-muted-foreground">Team</p>
                          <p className="text-sm truncate">
                            {isVisibleToAll
                              ? "Available to all employees"
                              : assignedEmployees.length > 0
                                ? `${assignedEmployees.length} employee${assignedEmployees.length > 1 ? "s" : ""} assigned`
                                : "Unassigned"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-muted-foreground">Created</p>
                          <p className="text-sm">{formatDate(createdDate)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Accept / Decline — only show if job is pending AND not taken by someone else */}
                    {isPending && !acceptedByOther && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleAcceptJob(job.id)}
                          disabled={updatingJobId === job.id}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                          onClick={() => handleDeclineJob(job.id)}
                          disabled={updatingJobId === job.id}
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />Decline
                        </Button>
                      </div>
                    )}

                    {/* Accepted by another employee */}
                    {acceptedByOther && !isCompleted && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                        <div className="flex items-center gap-2 text-blue-700">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span className="text-sm font-medium">
                            Accepted by {assignedEmployeeName || "another employee"}
                          </span>
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Job Completed!</span>
                        </div>
                      </div>
                    )}

                    {isDeclined && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <XCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">You declined this job</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}
