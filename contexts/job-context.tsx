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
  isLoading: boolean
}

const JobContext = createContext<JobContextType | undefined>(undefined)

export function JobProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, isSyncing } = useAuth()

  const [jobs, setJobs] = useState<Job[]>(() => {
    if (typeof window !== "undefined") {
      const savedJobs = localStorage.getItem("smarterp-jobs")
      return savedJobs ? JSON.parse(savedJobs) : mockJobs
    }
    return mockJobs
  })

  const [isLoading, setIsLoading] = useState(true)
  const hasSyncedRef = useRef(false)

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

          try {
            const current = JSON.stringify(jobs)
            const incoming = JSON.stringify(normalized)
            if (current !== incoming) {
              setJobs(normalized)
              localStorage.setItem("smarterp-jobs", incoming)
            }
          } catch (err) {
            setJobs(normalized)
            localStorage.setItem("smarterp-jobs", JSON.stringify(normalized))
          }
        }
      } catch (err) {
        console.log(
          "[v0] Backend unavailable, using local jobs. Error:",
          err instanceof Error ? err.message : String(err),
        )
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    if (!authLoading) {
      if (!hasSyncedRef.current) {
        loadJobs()
        hasSyncedRef.current = true
      }
      intervalId = setInterval(loadJobs, 5000)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [user, authLoading])

  const { addNotification } = useNotifications()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        localStorage.setItem("smarterp-jobs", JSON.stringify(jobs))
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [jobs])

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
          console.warn("Failed to parse smarterp-jobs from storage event", err)
        }
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
      } catch (err) {
        console.warn("Failed to persist job to server, saved locally", err)
      }
    })()

    if (job.assignedEmployees && job.assignedEmployees.length > 0) {
      job.assignedEmployees.forEach((employeeId) => {
        addNotification({
          type: "info",
          title: "New Job Assignment",
          message: `You've been assigned to the "${job.title}" project. Check your jobs page for details.`,
          priority: "medium",
          userId: employeeId,
          data: { jobId: job.id, jobTitle: job.title },
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
                type: "info",
                title: "New Job Assignment",
                message: `You've been assigned to the "${updatedJob.title}" project. Check your jobs page for details.`,
                priority: "medium",
                userId: employeeId,
                data: { jobId: updatedJob.id, jobTitle: updatedJob.title },
              })
            })
          }

          return updatedJob
        }
        return job
      })
      return updatedJobs
    })
    ;(async () => {
      try {
        await apiClient(`/api/jobs/${id}`, { method: "PUT", body: JSON.stringify(updates) })
      } catch (err) {
        console.warn("Failed to update job on server, update applied locally", err)
      }
    })()
  }

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id))
    ;(async () => {
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
        if (
          Array.isArray(job.assignedEmployees) &&
          job.assignedEmployees.some((a: any) => String(a) === String(employeeId))
        )
          return true

        if ((job as any).assigned_to && String((job as any).assigned_to) === String(employeeId)) return true
        if ((job as any).assignedTo && String((job as any).assignedTo) === String(employeeId)) return true
      } catch (err) {
        // ignore malformed job shapes
      }
      return false
    })
  }

  return (
    <JobContext.Provider
      value={{
        jobs,
        addJob,
        updateJob,
        deleteJob,
        getJobsByEmployee,
        isLoading: authLoading || isSyncing,
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
