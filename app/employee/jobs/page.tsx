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
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
const AUTO_REFRESH_MS = 30_000

import { getAuthToken, apiClient } from "@/lib/apiClient"
function jobAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
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
  const { jobs: allJobs, refreshJobs } = useJobs()
  const { user: currentUser } = useAuth()

  // Secondary guard: employees should only see jobs assigned to them or visible to all.
  // The backend already filters this, but stale localStorage cache from an owner session
  // could leak all-company jobs. This ensures the employee view is always scoped correctly.
  const jobs = currentUser?.role === 'employee'
    ? allJobs.filter((job: any) => {
        const userId = String(currentUser.id || "")
        const assignedTo = job.assigned_to ? String(job.assigned_to) : null
        const assignedEmployees = Array.isArray(job.assignedEmployees)
          ? job.assignedEmployees.map(String)
          : []
        return (
          job.visible_to_all === true ||
          assignedTo === userId ||
          assignedEmployees.includes(userId)
        )
      })
    : allJobs
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)
  const [progressValues, setProgressValues] = useState<Record<string, number>>({})
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
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
      setError(null)
      await refreshJobs()
      setLastUpdated(new Date())
    } catch (err: any) {
      setError({
        title: "Could not load jobs",
        message: err.message || "There was a problem connecting to the server. Please try again."
      })
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
      await apiClient(`/api/jobs/${jobId}/accept`, { method: "POST" })
      showNotification("success", "Job accepted successfully!")
      await refreshJobs()
      setLastUpdated(new Date())
    } catch (err: any) {
      // On 409, refresh immediately so stale job state is cleared
      if (err.status === 409) {
        await refreshJobs()
        setLastUpdated(new Date())
      }
      showNotification("error", err.message || "Failed to accept job. Please try again.")
    } finally {
      setUpdatingJobId(null)
    }
  }

  const handleDeclineJob = async (jobId: string) => {
    setUpdatingJobId(jobId)
    try {
      await apiClient(`/api/jobs/${jobId}/decline`, { method: "POST" })
      showNotification("success", "Job declined.")
      await refreshJobs()
      setLastUpdated(new Date())
    } catch (err: any) {
      showNotification("error", err.message || "Failed to decline job. Please try again.")
    } finally {
      setUpdatingJobId(null)
    }
  }

  const handleProgressUpdate = async (jobId: string, progress: number) => {
    setUpdatingJobId(jobId)
    try {
      await apiClient(`/api/jobs/${jobId}/progress`, {
        method: "POST",
        body: JSON.stringify({ progress }),
      })
      showNotification("success", `Progress updated to ${progress}%`)
      await refreshJobs()
      setLastUpdated(new Date())
    } catch (err: any) {
      showNotification("error", err.message || "Failed to update progress. Please try again.")
    } finally {
      setUpdatingJobId(null)
    }
  }

  if (isRefreshing && jobs.length === 0) {
    return (
      <EmployeeLayout>
        <div className="p-8 max-w-7xl mx-auto space-y-10">
          <div className="h-24 w-1/2 bg-muted/20 animate-pulse rounded-xl" />
          <SkeletonList count={6} />
        </div>
      </EmployeeLayout>
    )
  }

  if (error && jobs.length === 0) {
    return (
      <EmployeeLayout>
        <div className="p-8 max-w-7xl mx-auto">
          <ErrorView 
            title={error.title} 
            message={error.message} 
            onRetry={handleRefresh} 
          />
        </div>
      </EmployeeLayout>
    )
  }

  if (jobs.length === 0) {
    return (
      <EmployeeLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Available <span className="text-primary">Assignments</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              Review and manage your project load. Only accepted assignments will appear in your active workstream.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2 btn-premium h-10 px-4">
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Sync Directory
            </Button>
            {lastUpdated && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </div>
        </div>

        <EmptyState 
          icon={Briefcase}
          title="No jobs available yet"
          description="New projects will appear here when they are assigned to you by the owner."
          actionLabel="Refresh Directory"
          onAction={handleRefresh}
        />
      </div>
    </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Available <span className="text-primary">Assignments</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              Review and manage your project load. Only accepted assignments will appear in your active workstream.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2 btn-premium h-10 px-4">
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Sync Directory
            </Button>
            {lastUpdated && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.map((job) => {
            const status = job.status || "pending"
            const employeeStatus = job.employee_status || "pending"
            const progress = progressValues[job.id] ?? (job.progress || 0)
            const createdDate = job.created_at || job.createdAt
            
            const isPending = (employeeStatus as string) === "pending" || (employeeStatus as string) === "assigned"
            const isAccepted = employeeStatus === "accepted"
            const isDeclined = employeeStatus === "declined"
            // Treat as completed if status is completed OR progress is 100
            const isCompleted = status?.toLowerCase() === "completed" || progress === 100
            const displayStatus = isCompleted ? "completed" : status
            const acceptedByOther = isAccepted && (job as any).assigned_to && String((job as any).assigned_to) !== String(currentUser?.id)
            const assignedEmployeeName = (job as any).assigned_employee_name

            return (
              <Card
                key={job.id}
                className={cn(
                  "premium-card hover-lift group border-none shadow-sm hover:shadow-xl overflow-hidden",
                  isDeclined && "opacity-60 grayscale-[0.5]"
                )}
              >
                <div className={cn(
                  "h-1.5 w-full transition-colors",
                  isCompleted ? "bg-green-500" : isAccepted ? "bg-primary" : "bg-orange-500"
                )} />
                
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0">
                      {displayStatus}
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      ID: #{job.id.toString().slice(-4)}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight group-hover:text-primary transition-colors leading-tight">
                    {job.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-6">
                  <p className="text-meta line-clamp-2 min-h-[40px]">
                    {job.description || "Project parameters and execution guidelines not specified."}
                  </p>

                  {isAccepted && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Execution Progress</span>
                        <span className="text-sm font-black text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      {!isCompleted && (
                        <div className="space-y-4 pt-2">
                          <Slider
                            value={[progress]}
                            onValueChange={(v) => setProgressValues({ ...progressValues, [job.id]: v[0] })}
                            max={100}
                            step={5}
                            disabled={updatingJobId === job.id}
                          />
                          {progress !== (job.progress || 0) && (
                            <Button
                              size="sm"
                              className="w-full btn-premium h-9 font-bold"
                              onClick={() => handleProgressUpdate(job.id, progress)}
                              disabled={updatingJobId === job.id}
                            >
                              Update Status
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 pt-2 border-t border-dashed border-border/60">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {job.visible_to_all ? "Broadcast Group" : "Personal Assignment"}
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Issued {formatDate(createdDate)}
                    </div>                  </div>

                  {isPending && !acceptedByOther && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 btn-premium h-11 font-black tracking-tight"
                        onClick={() => handleAcceptJob(job.id)}
                        disabled={updatingJobId === job.id}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 h-11 font-bold text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDeclineJob(job.id)}
                        disabled={updatingJobId === job.id}
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {acceptedByOther && !isCompleted && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {assignedEmployeeName?.[0] || "O"}
                      </div>
                      <span className="text-xs font-bold text-primary tracking-tight">
                        Secured by {assignedEmployeeName || "Team Member"}
                      </span>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Project Finalized</span>
                    </div>
                  )}

                  {isDeclined && (
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Assignment Declined</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </EmployeeLayout>
  )
}
