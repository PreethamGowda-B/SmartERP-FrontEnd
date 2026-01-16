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
  const isRefreshingRef = useRef(false) // Prevent concurrent refreshes

  // Normalize jobs coming from the server to match expected shape
  const normalizeJob = (s: any): Job => {
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
  }

  // When authenticated, fetch jobs from the backend
  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function loadJobs() {
      // Prevent concurrent refresh attempts
      if (isRefreshingRef.current) {
        console.log("[JobContext] Skipping refresh - already in progress")
        return
      }

      if (!user) return
      
      isRefreshingRef.current = true
      
      try {
        console.log("[JobContext] Fetching jobs from backend...")
        const serverJobs = await apiClient("/api/jobs", { method: "GET" })
        console.log("[JobContext] Successfully fetched jobs:", serverJobs)
        
        if (mounted && Array.isArray(serverJobs)) {
          const normalized = serverJobs.map(normalizeJob)
          
          // Sort by creation date to ensure consistent ordering
          normalized.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime()
            const dateB = new Date(b.created_at || 0).getTime()
            return dateB - dateA // Newest first
          })

          // Update jobs state
          setJobs(normalized)
          
          // Save to localStorage
          try {
            localStorage.setItem("smarterp-jobs", JSON.stringify(normalized))
          } catch (err) {
            console.warn("[JobContext] Failed to save to localStorage:", err)
          }
        }
      } catch (err) {
        console.log(
          "[JobContext] Backend unavailable, using local jobs. Error:",
          err instanceof Error ? err.message : String(err),
        )
      } finally {
        isRefreshingRef.current = false
      }
    }

    if (!isLoading) {
      if (!hasSyncedRef.current) {
        loadJobs()
        hasSyncedRef.current = true
      }
      // Increased polling interval from 1500ms to 5000ms (5 seconds)
      // This prevents the rapid refresh that was causing jobs to disappear
      intervalId = setInterval(loadJobs, 5000)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [user, isLoading])

  const { addNotification } = useNotifications()

  // Debounced localStorage save
  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem("smarterp-jobs", JSON.stringify(jobs))
        } catch (err) {
          console.warn("[JobContext] Failed to save to localStorage:", err)
        }
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [jobs])

  // Keep jobs in sync across tabs
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
          console.warn("[JobContext] Failed to parse smarterp-jobs from storage event", err)
        }
      }
    }

    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const addJob = async (job: Job) => {
    console.log("[JobContext] Adding job:", job)
    
    // Optimistically add to local state
    setJobs((prev) => [job, ...prev])
    
    // Persist to backend
    try {
      const response = await apiClient("/api/jobs", { 
        method: "POST", 
        body: JSON.stringify(job) 
      })
      console.log("[JobContext] Job created on server:", response)
      
      // Update local state with server response (which includes DB-generated fields)
      setJobs((prev) => {
        const withoutTemp = prev.filter(j => j.id !== job.id)
        return [normalizeJob(response), ...withoutTemp]
      })
      
      // Send notifications
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
    } catch (err) {
      console.error("[JobContext] Failed to persist job to server:", err)
      // Optionally: show error notification or revert optimistic update
    }
  }

  const updateJob = async (id: string, updates: Partial<Job>) => {
    console.log("[JobContext] Updating job:", id, updates)
    
    // Optimistically update local state
    setJobs((prev) => {
      return prev.map((job) => {
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
    })

    // Persist to backend
    try {
      const response = await apiClient(`/api/jobs/${id}`, { 
        method: "PUT", 
        body: JSON.stringify(updates) 
      })
      console.log("[JobContext] Job updated on server:", response)
      
      // Update with server response
      setJobs((prev) => prev.map(job => 
        job.id === id ? normalizeJob(response) : job
      ))
    } catch (err) {
      console.error("[JobContext] Failed to update job on server:", err)
    }
  }

  const deleteJob = async (id: string) => {
    console.log("[JobContext] Deleting job:", id)
    
    // Optimistically remove from local state
    setJobs((prev) => prev.filter((job) => job.id !== id))
    
    // Persist to backend
    try {
      await apiClient(`/api/jobs/${id}`, { method: "DELETE" })
      console.log("[JobContext] Job deleted on server")
    } catch (err) {
      console.error("[JobContext] Failed to delete job on server:", err)
    }
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
        console.warn("[JobContext] Error checking job assignment:", err)
      }
      return false
    })
  }

  const refreshJobs = async () => {
    if (!user) return
    if (isRefreshingRef.current) {
      console.log("[JobContext] Refresh already in progress")
      return
    }

    isRefreshingRef.current = true
    
    try {
      console.log("[JobContext] Manually refreshing jobs...")
      const serverJobs = await apiClient("/api/jobs", { method: "GET" })
      
      if (Array.isArray(serverJobs)) {
        const normalized = serverJobs.map(normalizeJob)
        
        // Sort by creation date
        normalized.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        })

        setJobs(normalized)
        localStorage.setItem("smarterp-jobs", JSON.stringify(normalized))
      }
    } catch (err) {
      console.error("[JobContext] Failed to refresh jobs:", err)
    } finally {
      isRefreshingRef.current = false
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
