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

  // ✅ RESET sync state on login / logout (CRITICAL FIX)
  useEffect(() => {
    hasSyncedRef.current = false
  }, [user])

  // Fetch jobs from backend when authenticated
  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function loadJobs() {
      // ✅ HARD GUARD (prevents 401 on 2nd login)
      if (!user || isLoading) return

      try {
        console.log("[v0] Fetching jobs from backend...")
        const serverJobs = await apiClient("/api/jobs", { method: "GET" })

        if (mounted && Array.isArray(serverJobs)) {
          const normalized = serverJobs.map((s: any) => {
            const assignedArr = Array.isArray(s.assignedEmployees) ? s.assignedEmployees : null
            const topAssigned = s.assigned_to ?? s.assignedTo ?? null

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

          try {
            const current = JSON.stringify(jobs)
            const incoming = JSON.stringify(normalized)
            if (current !== incoming) {
              setJobs(normalized)
              localStorage.setItem("smarterp-jobs", incoming)
            }
          } catch {
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

    // ✅ Only start syncing when auth is READY
    if (!isLoading && user) {
      if (!hasSyncedRef.current) {
        loadJobs()
        hasSyncedRef.current = true
      }

      intervalId = setInterval(loadJobs, 1500)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [user, isLoading]) // jobs intentionally excluded

  const { addNotification } = useNotifications()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        localStorage.setItem("smarterp-jobs", JSON.stringify(jobs))
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [jobs])

  // Sync jobs across tabs
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
        } catch {}
      }
    }

    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const addJob = (job: Job) => {
    setJobs((prev) => [job, ...prev])

    ;(async () => {
      try {
        await apiClient("/api/jobs", { method: "POST", body: JSON.stringify(job) })
      } catch {
        console.warn("Failed to persist job to server, saved locally")
      }
    })()

    if (job.assignedEmployees?.length) {
      job.assignedEmployees.forEach((employeeId) => {
        addNotification({
          type: "info",
          title: "New Job Assignment",
          message: `You've been assigned to the "${job.title}" project.`,
          priority: "medium",
          userId: employeeId,
          data: { jobId: job.id, jobTitle: job.title },
        })
      })
    }
  }

  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job)),
    )

    ;(async () => {
      try {
        await apiClient(`/api/jobs/${id}`, { method: "PUT", body: JSON.stringify(updates) })
      } catch {
        console.warn("Failed to update job on server, updated locally")
      }
    })()
  }

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id))

    ;(async () => {
      try {
        await apiClient(`/api/jobs/${id}`, { method: "DELETE" })
      } catch {
        console.warn("Failed to delete job on server, deleted locally")
      }
    })()
  }

  const getJobsByEmployee = (employeeId: string) => {
    return jobs.filter((job) =>
      job.assignedEmployees?.some((a) => String(a) === String(employeeId)),
    )
  }

  return (
    <JobContext.Provider
      value={{
        jobs,
        addJob,
        updateJob,
        deleteJob,
        getJobsByEmployee,
      }}
    >
      {children}
    </JobContext.Provider>
  )
}

export function useJobs() {
  const context = useContext(JobContext)
  if (!context) {
    throw new Error("useJobs must be used within a JobProvider")
  }
  return context
}
