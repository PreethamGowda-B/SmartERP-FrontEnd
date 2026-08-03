"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { type Job } from "@/lib/data"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import { useNotifications } from "@/contexts/notification-context"
import { logger } from "@/lib/logger"

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

  const [jobs, setJobs] = useState<Job[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedJobs = localStorage.getItem("smarterp-jobs")
        const savedRole = localStorage.getItem("smarterp-jobs-role")
        if (savedJobs) {
          const parsed = JSON.parse(savedJobs)
          // Detect and discard mock/demo data (mock IDs are simple integers like "1","2","3")
          // Real IDs from the backend are UUIDs or larger integers
          if (Array.isArray(parsed) && parsed.length > 0) {
            const isMockData = parsed.every((j: any) => {
              const id = String(j.id || "")
              return id === "1" || id === "2" || id === "3" || id === "4" || id === "5"
            })
            if (!isMockData) {
              return parsed
            }
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return []
  })

  const hasSyncedRef = useRef(false)

  // When authenticated, fetch jobs from the backend. If that fails, keep using
  // localStorage/mock data so the UI remains functional offline.
  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function loadJobs() {
      if (!user) return
      try {
        logger.log("[v0] Fetching jobs from backend...")

        // Clear cached jobs if the role has changed (e.g. owner cache seen by employee)
        const cachedRole = localStorage.getItem("smarterp-jobs-role")
        if (cachedRole && cachedRole !== user.role) {
          localStorage.removeItem("smarterp-jobs")
          localStorage.removeItem("smarterp-jobs-role")
          setJobs([])
        }

        const serverJobs = await apiClient("/api/jobs", { method: "GET" })
        logger.log("[v0] Successfully fetched jobs:", serverJobs)
        if (mounted && Array.isArray(serverJobs)) {
          // Normalize server jobs so each job has a stable shape the UI expects.
          const normalized = serverJobs.map((s: any) => {
            // prefer an explicit assignedEmployees array if present
            const assignedArr = Array.isArray(s.assignedEmployees) ? s.assignedEmployees : null
            // fallback to top-level assigned_to or assignedTo (unknown shapes from server)
            const topAssigned = (s as any).assigned_to ?? (s as any).assignedTo ?? null
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

            const invoice = flatInvoiceId
              ? {
                  id: String(flatInvoiceId),
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
              : (nestedInvoice ?? null)

            return {
              // prefer server-provided fields but ensure id and assignedEmployees exist
              id: s.id?.toString?.() ?? String(s._db_row?.id ?? s.id ?? ""),
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
            const current = JSON.stringify(jobs)
            const incoming = JSON.stringify(normalized)
            if (current !== incoming) {
              setJobs(normalized)
              localStorage.setItem("smarterp-jobs", incoming)
              localStorage.setItem("smarterp-jobs-role", user.role)
            }
          } catch (err) {
            // fallback: set jobs if serialization fails
            setJobs(normalized)
            localStorage.setItem("smarterp-jobs", JSON.stringify(normalized))
            localStorage.setItem("smarterp-jobs-role", user.role)
          }
        }
      } catch (err) {
        logger.log(
          "[v0] Backend unavailable, using local jobs. Error:",
          err instanceof Error ? err.message : String(err),
        )
      }
    }

    if (!isLoading) {
      if (!hasSyncedRef.current) {
        loadJobs()
        hasSyncedRef.current = true
      }
      // Poll every 30 seconds — 1500ms was hammering the backend with ~40 calls/min
      intervalId = setInterval(loadJobs, 30000)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [user?.id, user?.role, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const { addNotification } = useNotifications()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        localStorage.setItem("smarterp-jobs", JSON.stringify(jobs))
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [jobs])

  // Keep jobs in sync across tabs in the same browser: when another tab writes
  // to localStorage we should pick up the new jobs so users see updates
  // immediately (best-effort, same-browser only).
  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (e: StorageEvent) => {
      if (e.key === "smarterp-jobs") {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue)
            if (Array.isArray(parsed)) {
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
  }, [])

  const addJob = useCallback((job: Job) => {
    setJobs((prev) => [job, ...prev])
      // persist to backend (best-effort)
      ; (async () => {
        try {
          await apiClient("/api/jobs", { method: "POST", body: JSON.stringify(job) })
        } catch (err) {
          logger.warn("Failed to persist job to server, saved locally", err)
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
          logger.warn("Failed to update job on server, update applied locally", err)
        }
      })()
  }, [addNotification])

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id))
      ; (async () => {
        try {
          await apiClient(`/api/jobs/${id}`, { method: "DELETE" })
        } catch (err) {
          logger.warn("Failed to delete job on server, deletion applied locally", err)
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
    if (!user) return
    try {
      logger.log("[v0] Manually refreshing jobs...")
      const serverJobs = await apiClient("/api/jobs", { method: "GET" })
      if (Array.isArray(serverJobs)) {
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

        setJobs(normalized)
        localStorage.setItem("smarterp-jobs", JSON.stringify(normalized))
        if (user.role) localStorage.setItem("smarterp-jobs-role", user.role)
      }
    } catch (err) {
      logger.error("[v0] Failed to refresh jobs:", err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)))
    }
  }, [user?.id, user?.role])

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
      {children}
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
