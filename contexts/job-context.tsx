"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { mockJobs, type Job } from "@/lib/data"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import { useNotifications } from "@/contexts/notification-context"

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
      const savedJobs = localStorage.getItem("smarterp-jobs")
      return savedJobs ? JSON.parse(savedJobs) : mockJobs
    }
    return mockJobs
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
        console.log("[v0] Fetching jobs from backend...")
        const serverJobs = await apiClient("/api/jobs", { method: "GET" })
        console.log("[v0] Successfully fetched jobs:", serverJobs)
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

            return {
              // prefer server-provided fields but ensure id and assignedEmployees exist
              id: s.id?.toString?.() ?? String(s._db_row?.id ?? s.id ?? ""),
              title: s.title ?? s.name ?? s.jobTitle ?? "",
              description: s.description ?? s.details ?? "",
              assignedEmployees,
              // keep any other server-provided fields
              ...s,
            }
          })

          // Update only when the server data differs to avoid stomping local changes
          try {
            const current = JSON.stringify(jobs)
            const incoming = JSON.stringify(normalized)
            if (current !== incoming) {
              setJobs(normalized)
              localStorage.setItem("smarterp-jobs", incoming)
            }
          } catch (err) {
            // fallback: set jobs if serialization fails
            setJobs(normalized)
            localStorage.setItem("smarterp-jobs", JSON.stringify(normalized))
          }
        }
      } catch (err) {
        console.log(
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
  }, [user, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

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
          console.warn("Failed to parse smarterp-jobs from storage event", err)
        }
      }
    }

    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const addJob = (job: Job) => {
    setJobs((prev) => [job, ...prev])
      // persist to backend (best-effort)
      ; (async () => {
        try {
          await apiClient("/api/jobs", { method: "POST", body: JSON.stringify(job) })
        } catch (err) {
          console.warn("Failed to persist job to server, saved locally", err)
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
  }

  const updateJob = (id: string, updates: Partial<Job>) => {
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
          console.warn("Failed to update job on server, update applied locally", err)
        }
      })()
  }

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id))
      ; (async () => {
        try {
          await apiClient(`/api/jobs/${id}`, { method: "DELETE" })
        } catch (err) {
          console.warn("Failed to delete job on server, deletion applied locally", err)
        }
      })()
  }

  const getJobsByEmployee = (employeeId: string) => {
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
  }

  const refreshJobs = async () => {
    if (!user) return
    try {
      console.log("[v0] Manually refreshing jobs...")
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
      }
    } catch (err) {
      console.error("[v0] Failed to refresh jobs:", err)
    }
  }

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
