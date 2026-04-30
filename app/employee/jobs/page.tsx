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
  accepted_at?: string
  completed_at?: string
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
                const { label: statusLabel, color: statusColor } = getDisplayStatus(job)
                const progress = progressValues[job.id] ?? (job.progress || 0)
                const isCompleted = job.status === "completed"
                const isAccepted = job.employee_status === "accepted" && !isCompleted
                const canAccept = job.employee_status === "assigned" && !isCompleted
                const isDeclined = job.employee_status === "declined"

                const colorClasses = {
                  green: "from-green-50/80 to-emerald-50/80 shadow-green-200/50",
                  blue: "from-blue-50/80 to-indigo-50/80 shadow-blue-200/50",
                  yellow: "bg-white/80",
                  red: "from-red-50/60 to-pink-50/60 opacity-70",
                  gray: "from-gray-50/80 to-slate-50/80",
                }

                const barClasses = {
                  green: "from-green-400 via-green-500 to-emerald-500",
                  blue: "from-blue-400 via-indigo-500 to-purple-500",
                  yellow: "from-yellow-400 via-orange-400 to-amber-500",
                  red: "from-red-400 via-pink-500 to-rose-500",
                  gray: "from-gray-300 to-gray-400",
                }

                return (
                  <Card
                    key={job.id}
                    className={cn(
                      "group relative overflow-hidden border-0 bg-gradient-to-br backdrop-blur-xl shadow-xl transition-all duration-500 hover:scale-[1.02]",
                      colorClasses[statusColor]
                    )}
                  >
                    {/* Top color bar */}
                    <div className={cn("h-1.5 w-full bg-gradient-to-r", barClasses[statusColor])} />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <Badge
                            className={cn(
                              "text-xs font-semibold",
                              statusColor === "green" && "bg-green-100 text-green-700 border-green-200",
                              statusColor === "blue" && "bg-blue-100 text-blue-700 border-blue-200",
                              statusColor === "yellow" && "bg-yellow-100 text-yellow-700 border-yellow-200",
                              statusColor === "red" && "bg-red-100 text-red-700 border-red-200",
                              statusColor === "gray" && "bg-gray-100 text-gray-600 border-gray-200",
                            )}
                            variant="outline"
                          >
                            {statusColor === "green" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {statusColor === "blue" && <Clock className="w-3 h-3 mr-1" />}
                            {statusColor === "yellow" && <AlertCircle className="w-3 h-3 mr-1" />}
                            {statusColor === "red" && <XCircle className="w-3 h-3 mr-1" />}
                            {statusLabel}
                          </Badge>
                          <CardTitle className="text-lg leading-tight line-clamp-2">
                            {job.title}
                          </CardTitle>
                        </div>
                      </div>
                      {job.description && (
                        <CardDescription className="text-sm line-clamp-2">{job.description}</CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress — only for accepted in-progress jobs */}
                      {isAccepted && (
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Progress</span>
                            <span className="font-bold">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2.5" />
                          <div className="space-y-2 pt-1">
                            <Slider
                              value={[progress]}
                              onValueChange={(v) => setProgressValues(prev => ({ ...prev, [job.id]: v[0] }))}
                              max={100} step={10}
                              disabled={updatingJobId === job.id}
                            />
                            {progress !== (job.progress || 0) && (
                              <Button
                                size="sm" className="w-full"
                                onClick={() => updateProgress(job.id, progress)}
                                disabled={updatingJobId === job.id}
                              >
                                {updatingJobId === job.id ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                                ) : `Save ${progress}%`}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(job.created_at)}</span>
                      </div>

                      {/* Accept / Decline buttons (only when employee_status = 'assigned') */}
                      {canAccept && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => acceptJob(job.id)}
                            disabled={updatingJobId === job.id}
                          >
                            {updatingJobId === job.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <><ThumbsUp className="w-4 h-4 mr-2" />Accept</>
                            }
                          </Button>
                          <Button
                            variant="outline" className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => declineJob(job.id)}
                            disabled={updatingJobId === job.id}
                          >
                            <ThumbsDown className="w-4 h-4 mr-2" />Decline
                          </Button>
                        </div>
                      )}

                      {/* Completed banner */}
                      {isCompleted && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Job completed successfully</span>
                        </div>
                      )}

                      {/* Declined banner */}
                      {isDeclined && !isCompleted && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
                          <XCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">You declined this job</span>
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
