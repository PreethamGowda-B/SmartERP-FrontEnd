"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { type Job } from "@/lib/data"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import { isPublicRoute } from "@/lib/route-utils"
import { useNotifications } from "@/contexts/notification-context"
import { logger } from "@/lib/logger"
import { toast } from "sonner"

interface JobContextType {
  jobs: Job[]
  addJob: (job: Job) => void
  updateJob: (id: string, updates: Partial<Job>) => void
  deleteJob: (id: string) => void
  getJobsByEmployee: (employeeId: string) => Job[]
  refreshJobs: () => Promise<void>
}

const JobContext = createContext<JobContextType | undefined>(undefined)

export function JobProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const isPublic = isPublicRoute(pathname)

  const [jobs, setJobs] = useState<Job[]>([])
  const [refreshError, setRefreshError] = useState(false)
  const hasSyncedRef = useRef(false)
  const loadedScopeRef = useRef<string | null>(null)
  const activeScopeRef = useRef<string | null>(null)
  const jobsScopeRef = useRef<string | null>(null)
  const requestInFlightRef = useRef(false)
  const requestWaitersRef = useRef<Array<() => void>>([])
  const scope = user
    ? `${String(user.company_id ?? (user as any).companyId ?? "no-company")}:${String(user.id)}:${String(user.role || "").toLowerCase()}`
    : null
  const storageKey = scope ? `smarterp-jobs:${scope}` : null

  // Hydrate only after the authenticated identity is known. The old unscoped
  // key could leak another user's cached list and an initial [] could overwrite it.
  useEffect(() => {
    if (isLoading || !user || !storageKey) return
    if (activeScopeRef.current !== scope) {
      activeScopeRef.current = scope
      loadedScopeRef.current = null
      jobsScopeRef.current = null
      hasSyncedRef.current = false
    }

    try {
      const savedJobs = localStorage.getItem(storageKey)
      let scopedJobs: Job[] = []
      if (savedJobs) {
        const parsed = JSON.parse(savedJobs)
        const isMockData = Array.isArray(parsed) && parsed.length > 0 && parsed.every((j: any) =>
          ["1", "2", "3", "4", "5"].includes(String(j.id || "")),
        )
        if (Array.isArray(parsed) && !isMockData) scopedJobs = parsed
      }
      jobsScopeRef.current = scope
      setJobs(scopedJobs)
    } catch {
      // A malformed cache is ignored; the authenticated API remains authoritative.
      jobsScopeRef.current = scope
      setJobs([])
    }
    loadedScopeRef.current = scope
  }, [isLoading, user, scope, storageKey])

  // When authenticated, fetch jobs from the backend. If that fails, keep using
  // localStorage/mock data so the UI remains functional offline.
  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function loadJobs() {
      if (isPublic || !user || !storageKey || loadedScopeRef.current !== scope || requestInFlightRef.current) return
      requestInFlightRef.current = true

      try {
        logger.log("[v0] Fetching jobs from backend...")
        const serverJobs = await apiClient("/api/jobs", { method: "GET", skipCache: true } as RequestInit)
        logger.log("[v0] Successfully fetched jobs:", serverJobs)
        if (mounted && activeScopeRef.current === scope && Array.isArray(serverJobs)) {
          setRefreshError(false)
          // Normalize server jobs so each job has a stable shape the UI expects.
          const normalized = serverJobs.map((s: any) => {
            // prefer an explicit assignedEmployees array if present
            const assignedArr = Array.isArray(s.assignedEmployees) ? s.assignedEmployees : null
            // fallback to top-level assigned_employee_id, assigned_to, or assignedTo
            const topAssigned = (s as any).assigned_employee_id ?? (s as any).assigned_to ?? (s as any).assignedTo ?? null
            const assignedEmployees = Array.isArray(assignedArr)
              ? assignedArr.map((a: any) => String(a))
              : topAssigned != null
                ? [String(topAssigned)]
                : []

            // Build a normalised nested `invoice` object from the flat SQL join columns
            // so JobCardFinancials always receives the LATEST invoice total.
            // The API returns: invoice_id, invoice_number, invoice_status,
            //                  invoice_total_amount, invoice_viewed_at, invoice_downloaded_at
            const flatInvoiceId = s.invoice_id ?? s.invoiceId ?? null
            const flatInvoiceTotal = s.invoice_total_amount ?? s.invoiceTotal ?? null
            const nestedInvoice = s.invoice && typeof s.invoice === "object" ? s.invoice : null

            const normalizedJobId = s.id?.toString?.() ?? String(s._db_row?.id ?? s.id ?? "")
            const invoice = flatInvoiceId
              ? {
                  id: String(flatInvoiceId),
                  job_id: normalizedJobId,
                  invoice_number: s.invoice_number ?? nestedInvoice?.invoice_number ?? "",
                  version_number: s.invoice_version_number ?? s.version_number ?? nestedInvoice?.version_number ?? 1,
                  edited_count: s.invoice_edited_count ?? s.edited_count ?? nestedInvoice?.edited_count ?? 0,
                  total_amount: flatInvoiceTotal != null
                    ? Number(flatInvoiceTotal)
                    : Number(nestedInvoice?.total_amount ?? 0),
                  status: s.invoice_status ?? nestedInvoice?.status ?? "issued",
                  viewed_at: s.invoice_viewed_at ?? nestedInvoice?.viewed_at ?? null,
                  downloaded_at: s.invoice_downloaded_at ?? nestedInvoice?.downloaded_at ?? null,
                }
              : (nestedInvoice ? { ...nestedInvoice, job_id: nestedInvoice.job_id || normalizedJobId } : null)

            return {
              // prefer server-provided fields but ensure id and assignedEmployees exist
              id: normalizedJobId,
              title: s.title ?? s.name ?? s.jobTitle ?? "",
              description: s.description ?? s.details ?? "",
              assignedEmployees,
              // keep any other server-provided fields
              ...s,
              // OVERRIDE: always use the freshly-built invoice object so the card
              // shows the correct latest total amount, not stale localStorage data.
              invoice,
            }
          })

          // Sort normalized jobs strictly created_at DESC (newest / latest created jobs first)
          normalized.sort((a: any, b: any) => {
            const timeA = new Date(a.created_at || a.startDate || a.created_date || 0).getTime()
            const timeB = new Date(b.created_at || b.startDate || b.created_date || 0).getTime()
            return timeB - timeA
          })

          // Update only when the server data differs to avoid stomping local changes
          try {
            const incoming = JSON.stringify(normalized)
            setJobs((prevJobs) => {
              const current = JSON.stringify(prevJobs)
              if (current !== incoming) {
                jobsScopeRef.current = scope
                localStorage.setItem(storageKey, incoming)
                return normalized
              }
              return prevJobs
            })
          } catch (err) {
            // fallback: set jobs if serialization fails
            jobsScopeRef.current = scope
            setJobs(normalized)
            localStorage.setItem(storageKey, JSON.stringify(normalized))
          }
        }
        else if (mounted && activeScopeRef.current === scope) {
          setRefreshError(true)
          throw new Error("The server returned an incomplete jobs response.")
        }
      } catch (err) {
        if (mounted && activeScopeRef.current === scope) setRefreshError(true)
        logger.log(
          "[v0] Backend unavailable, using local jobs. Error:",
          err instanceof Error ? err.message : String(err),
        )
      } finally {
        requestInFlightRef.current = false
        requestWaitersRef.current.splice(0).forEach((resolve) => resolve())
      }
    }

    if (!isLoading && user) {
      if (!hasSyncedRef.current) {
        loadJobs()
        hasSyncedRef.current = true
      }
      // Poll every 30 seconds for authenticated user
      intervalId = setInterval(loadJobs, 30000)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [user, isLoading, isPublic, scope, storageKey])

  const { addNotification } = useNotifications()

  useEffect(() => {
    if (typeof window !== "undefined" && storageKey && loadedScopeRef.current === scope && jobsScopeRef.current === scope) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(storageKey, JSON.stringify(jobs))
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [jobs, scope, storageKey])

  // Keep jobs in sync across tabs in the same browser: when another tab writes
  // to localStorage we should pick up the new jobs so users see updates
  // immediately (best-effort, same-browser only).
  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (e: StorageEvent) => {
      if (storageKey && e.key === storageKey && activeScopeRef.current === scope) {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue)
            if (Array.isArray(parsed)) {
              jobsScopeRef.current = scope
              setJobs(parsed)
            }
          }
        } catch (err) {
          // ignore malformed data
          logger.warn("Failed to parse smarterp-jobs from storage event", err)
        }
      }
    }

    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [scope, storageKey])

  const addJob = useCallback((job: Job) => {
    setJobs((prev) => [job, ...prev])
      // persist to backend (best-effort)
      ; (async () => {
        try {
          await apiClient("/api/jobs", { method: "POST", body: JSON.stringify(job) })
        } catch (err) {
          logger.warn("Failed to persist job to server", err)
          toast.error("This job could not be saved. The list will be refreshed from the server.")
          window.dispatchEvent(new Event("smarterp:jobs-refresh-requested"))
        }
      })()

    if (job.assignedEmployees && job.assignedEmployees.length > 0) {
      job.assignedEmployees.forEach((employeeId) => {
        addNotification({
          type: "job",
          title: "New Job Assignment",
          message: `You've been assigned to the "${job.title}" project. Check your jobs page for details.`,
          priority: "medium",
          data: { jobId: job.id, jobTitle: job.title, userId: employeeId },
        })
      })
    }
  }, [addNotification])

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs((prev) => {
      const updatedJobs = prev.map((job) => {
        if (job.id === id) {
          const updatedJob = { ...job, ...updates }

          if (updates.assignedEmployees) {
            const previousEmployees = job.assignedEmployees || []
            const newEmployees = updates.assignedEmployees.filter((empId) => !previousEmployees.includes(empId))

            newEmployees.forEach((employeeId) => {
              addNotification({
                type: "job",
                title: "New Job Assignment",
                message: `You've been assigned to the "${updatedJob.title}" project. Check your jobs page for details.`,
                priority: "medium",
                data: { jobId: updatedJob.id, jobTitle: updatedJob.title, userId: employeeId },
              })
            })
          }

          return updatedJob
        }
        return job
      })
      return updatedJobs
    })

      // best-effort update to backend
      ; (async () => {
        try {
          await apiClient(`/api/jobs/${id}`, { method: "PUT", body: JSON.stringify(updates) })
        } catch (err) {
          logger.warn("Failed to update job on server", err)
          toast.error("The job update could not be saved. The list will be refreshed from the server.")
          window.dispatchEvent(new Event("smarterp:jobs-refresh-requested"))
        }
      })()
  }, [addNotification])

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id))
      ; (async () => {
        try {
          await apiClient(`/api/jobs/${id}`, { method: "DELETE" })
        } catch (err) {
          logger.warn("Failed to delete job on server", err)
          toast.error("The job could not be deleted. The list will be refreshed from the server.")
          window.dispatchEvent(new Event("smarterp:jobs-refresh-requested"))
        }
      })()
  }, [])

  const getJobsByEmployee = useCallback((employeeId: string) => {
    return jobs.filter((job) => {
      try {
        // assignedEmployees normalized to array of strings
        if (
          Array.isArray(job.assignedEmployees) &&
          job.assignedEmployees.some((a: any) => String(a) === String(employeeId))
        )
          return true

        // fallbacks: check top-level assigned_to / assignedTo
        if ((job as any).assigned_to && String((job as any).assigned_to) === String(employeeId)) return true
        if ((job as any).assignedTo && String((job as any).assignedTo) === String(employeeId)) return true
      } catch (err) {
        // ignore malformed job shapes
      }
      return false
    })
  }, [jobs])

  const refreshJobs = useCallback(async () => {
    if (isPublic || !user || !storageKey || loadedScopeRef.current !== scope) return
    // A refresh button/event must not silently report success just because an
    // initial or periodic request is already running. Wait for it to finish,
    // then perform this authoritative refresh.
    while (requestInFlightRef.current) {
      await new Promise<void>((resolve) => requestWaitersRef.current.push(resolve))
      if (activeScopeRef.current !== scope) return
    }
    requestInFlightRef.current = true
    try {
      logger.log("[v0] Manually refreshing jobs...")
      const serverJobs = await apiClient("/api/jobs", { method: "GET", skipCache: true } as RequestInit)
      if (!Array.isArray(serverJobs)) throw new Error("The server returned an incomplete jobs response.")
      if (activeScopeRef.current === scope && Array.isArray(serverJobs)) {
        const normalized = serverJobs.map((s: any) => {
          const assignedArr = Array.isArray(s.assignedEmployees) ? s.assignedEmployees : null
          const topAssigned = (s as any).assigned_to ?? (s as any).assignedTo ?? null
          const assignedEmployees = Array.isArray(assignedArr)
            ? assignedArr.map((a: any) => String(a))
            : topAssigned != null
              ? [String(topAssigned)]
              : []

          return {
            id: s.id?.toString?.() ?? String(s._db_row?.id ?? s.id ?? ""),
            title: s.title ?? s.name ?? s.jobTitle ?? "",
            description: s.description ?? s.details ?? "",
            assignedEmployees,
            ...s,
          }
        })

        setRefreshError(false)
        jobsScopeRef.current = scope
        setJobs(normalized)
        localStorage.setItem(storageKey, JSON.stringify(normalized))
      }
    } catch (err: any) {
      setRefreshError(true)
      const isAuthErr = err?.status === 401 || err?.status === '401' || err?.message === "Authentication required" || JSON.stringify(err || {}).includes('401')
      if (!isAuthErr) {
        logger.error("[v0] Failed to refresh jobs:", err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)))
      }
    } finally {
      requestInFlightRef.current = false
      requestWaitersRef.current.splice(0).forEach((resolve) => resolve())
    }
  }, [user, isPublic, scope, storageKey])

  useEffect(() => {
    if (isPublic || !user) return
    const refreshOnNotification = (event: Event) => {
      const notification = (event as CustomEvent<any>).detail
      const type = String(notification?.type || "").toLowerCase()
      if (["job", "chat_message", "material_request", "invoice", "invoice_issued"].includes(type)) {
        void refreshJobs()
      }
    }
    const refreshOnJobEvent = (event: Event) => {
      const detail = (event as CustomEvent<any>).detail
      if (detail?.jobId || detail?.job_id) void refreshJobs()
    }
    window.addEventListener("smarterp:notification", refreshOnNotification)
    window.addEventListener("smarterp:job-event", refreshOnJobEvent)
    const refreshAfterFailedMutation = () => { void refreshJobs() }
    window.addEventListener("smarterp:jobs-refresh-requested", refreshAfterFailedMutation)
    return () => {
      window.removeEventListener("smarterp:notification", refreshOnNotification)
      window.removeEventListener("smarterp:job-event", refreshOnJobEvent)
      window.removeEventListener("smarterp:jobs-refresh-requested", refreshAfterFailedMutation)
    }
  }, [isPublic, user, refreshJobs])

  return (
    <JobContext.Provider
      value={{
        jobs,
        addJob,
        updateJob,
        deleteJob,
        getJobsByEmployee,
        refreshJobs,
      }}
    >
      <>
        {refreshError && !isPublic && (
          <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
            {jobs.length > 0 ? "Showing the last loaded jobs. The latest refresh failed." : "Could not refresh the jobs list. It may be incomplete."} <button type="button" className="font-semibold underline" onClick={() => void refreshJobs()}>Retry</button>
          </div>
        )}
        {children}
      </>
    </JobContext.Provider>
  )
}

export function useJobs() {
  const context = useContext(JobContext)
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobProvider")
  }
  return context
}
