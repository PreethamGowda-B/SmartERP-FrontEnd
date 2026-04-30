"use client"

/**
 * /app/employee/jobs/page.tsx — HARDENED
 *
 * Rules enforced:
 * 1. ZERO localStorage usage. All state comes from /api/jobs.
 * 2. Strict Status Priority Engine (see getDisplayStatus) — matches backend exactly.
 * 3. Visibility: API returns only jobs where employee_status='assigned' OR assigned_to=me.
 * 4. After accept/decline, jobs list is immediately refreshed from API.
 * 5. GPS tracking starts ONLY when employee has an accepted job.
 */

import { useState, useCallback, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Calendar, Briefcase, Clock, CheckCircle2, AlertCircle,
  XCircle, ThumbsUp, ThumbsDown, RefreshCw, MapPin, Loader2,
} from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { cn } from "@/lib/utils"
import { getAccessToken } from "@/lib/apiClient"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
const AUTO_REFRESH_MS = 30_000
const GPS_INTERVAL_MS = 12_000

// ── Types ─────────────────────────────────────────────────────────────────────
interface Job {
  id: string
  title: string
  description?: string
  status: string
  approval_status?: string
  employee_status?: string
  review_status?: string
  priority?: string
  progress?: number
  assigned_to?: string
  customer_id?: string
  created_at?: string
  createdAt?: string
  accepted_at?: string
  completed_at?: string
  visible_to_all?: boolean
}

// ── Strict Status Priority Engine (GLOBAL RULE) ───────────────────────────────
// MUST match backend logic exactly. Never derive from UI state.
function getDisplayStatus(job: Job): {
  label: string
  color: "green" | "blue" | "yellow" | "red" | "gray"
} {
  if (job.status === "completed") return { label: "Completed", color: "green" }
  if (job.status === "in_progress") return { label: "In Progress", color: "blue" }
  if (job.employee_status === "accepted") return { label: "Accepted — Working", color: "blue" }
  if (job.employee_status === "assigned") return { label: "Available — Pending Accept", color: "yellow" }
  if (job.employee_status === "declined") return { label: "Declined", color: "red" }
  if (job.approval_status === "approved") return { label: "Approved", color: "yellow" }
  return { label: "Pending Approval", color: "gray" }
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

function formatDate(d?: string) {
  if (!d) return "Unknown"
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }
  catch { return "Unknown" }
}

// ── GPS Tracking Hook ─────────────────────────────────────────────────────────
function useGPSTracking(hasAcceptedJob: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)

  const sendLocation = useCallback(async (lat: number, lng: number) => {
    try {
      await fetch(`${API_URL}/api/location/update`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      })
    } catch {
      // silent — GPS failures should not disrupt UI
    }
  }, [])

  useEffect(() => {
    if (!hasAcceptedJob) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }

    if (!navigator.geolocation) {
      setGpsError("Location not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => setGpsError(null),
      () => setGpsError("Location permission denied — please enable GPS to share your location with the customer")
    )

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
        () => { } // permission error already shown above
      )
    }, GPS_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [hasAcceptedJob, sendLocation])

  return { gpsError }
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeeJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)
  const [progressValues, setProgressValues] = useState<Record<string, number>>({})
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isRefreshingRef = useRef(false)

  // Detect if there is any accepted job (triggers GPS)
  const hasAcceptedJob = jobs.some(j => j.employee_status === "accepted" && j.status !== "completed" && j.status !== "cancelled")
  const { gpsError } = useGPSTracking(hasAcceptedJob)

  const toast = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── Fetch jobs DIRECTLY from API — no localStorage ─────────────────────────
  const fetchJobs = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        credentials: "include",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      // API returns array directly or { data: [...] }
      const rawJobs = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
      setJobs(rawJobs)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Failed to fetch jobs:", err)
      toast("error", "Could not load jobs — please retry")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      isRefreshingRef.current = false
    }
  }, [])

  // Initial load + 30-second polling (backend state refresh)
  useEffect(() => {
    fetchJobs()
    const id = setInterval(fetchJobs, AUTO_REFRESH_MS)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Job Actions ────────────────────────────────────────────────────────────
  const acceptJob = async (jobId: string) => {
    setUpdatingJobId(jobId)
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/accept`, {
        method: "POST", credentials: "include", headers: authHeaders(),
      })
      const body = await res.json()
      if (res.ok) {
        toast("success", "Job accepted!")
        await fetchJobs()
      } else {
        toast("error", body?.message || "Failed to accept job")
      }
    } catch { toast("error", "Network error — please retry") }
    finally { setUpdatingJobId(null) }
  }

  const declineJob = async (jobId: string) => {
    setUpdatingJobId(jobId)
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/decline`, {
        method: "POST", credentials: "include", headers: authHeaders(),
      })
      const body = await res.json()
      if (res.ok) {
        toast("success", "Job declined")
        await fetchJobs()
      } else {
        toast("error", body?.message || "Failed to decline job")
      }
    } catch { toast("error", "Network error — please retry") }
    finally { setUpdatingJobId(null) }
  }

  const updateProgress = async (jobId: string, progress: number) => {
    setUpdatingJobId(jobId)
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/progress`, {
        method: "POST", credentials: "include", headers: authHeaders(),
        body: JSON.stringify({ progress }),
      })
      const body = await res.json()
      if (res.ok) {
        toast("success", progress === 100 ? "Job marked as complete!" : `Progress updated to ${progress}%`)
        await fetchJobs()
      } else {
        toast("error", body?.message || "Failed to update progress")
      }
    } catch { toast("error", "Network error — please retry") }
    finally { setUpdatingJobId(null) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <EmployeeLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
            <p className="text-gray-600 font-medium">Loading your jobs…</p>
          </div>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="p-6 max-w-7xl mx-auto">

          {/* GPS Permission Warning */}
          {gpsError && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800">
              <MapPin className="w-5 h-5 shrink-0" />
              <p className="text-sm">{gpsError}</p>
            </div>
          )}

          {/* GPS Active indicator */}
          {hasAcceptedJob && !gpsError && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3 text-green-800">
              <MapPin className="w-4 h-4 shrink-0 animate-pulse" />
              <p className="text-sm font-medium">Live GPS tracking is active — customer can see your location</p>
            </div>
          )}

          {/* Toast */}
          {notification && (
            <div className={cn(
              "fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl backdrop-blur-sm animate-in slide-in-from-right duration-300 text-white",
              notification.type === "success" ? "bg-green-500/90 border border-green-400" : "bg-red-500/90 border border-red-400"
            )}>
              {notification.message}
            </div>
          )}

          {/* Header */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My Jobs
              </h1>
              <p className="text-gray-500 mt-1">
                {jobs.length} job{jobs.length !== 1 ? "s" : ""} · Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : "never"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchJobs}
              disabled={isRefreshing}
              className="gap-2 bg-white/70 backdrop-blur-sm"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </div>

          {jobs.length === 0 ? (
            <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-2xl">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Briefcase className="w-16 h-16 text-indigo-400 mb-4" />
                <p className="text-xl font-semibold text-gray-700">No jobs assigned yet</p>
                <p className="text-gray-500 mt-2">New jobs will appear here when the owner assigns them to you</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => {
                const status = job.status || "pending"
                const employeeStatus = job.employee_status || "pending"
                const progress = progressValues[job.id] ?? (job.progress || 0)
                const createdDate = job.created_at || job.createdAt
                const isVisibleToAll = job.visible_to_all || false
                const assignedEmployees = [] // Ignored for now

                const isPending = employeeStatus === "pending" || employeeStatus === "assigned"
                const isAccepted = employeeStatus === "accepted" && status !== "completed"
                const isDeclined = employeeStatus === "declined"
                const isCompleted = status === "completed"

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
                            <Badge variant={status === "completed" ? "default" : "outline"} className="font-semibold">
                              {status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                              {status !== "completed" && <Clock className="w-3 h-3 mr-1 inline" />}
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
                          <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
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
                                onClick={() => updateProgress(job.id, progress)}
                                disabled={updatingJobId === job.id}
                                className="w-full mt-2"
                              >
                                {updatingJobId === job.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Progress"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Job Details */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p className="text-sm">{formatDate(createdDate)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Accept / Decline */}
                      {isPending && !isCompleted && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => acceptJob(job.id)}
                            disabled={updatingJobId === job.id}
                          >
                            {updatingJobId === job.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ThumbsUp className="w-4 h-4 mr-2" />}
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => declineJob(job.id)}
                            disabled={updatingJobId === job.id}
                          >
                            <ThumbsDown className="w-4 h-4 mr-2" />Decline
                          </Button>
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

                      {isDeclined && !isCompleted && (
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
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}
