"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useJobs } from "@/contexts/job-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase, Clock, CheckCircle2, AlertCircle, XCircle, RefreshCw, Search, Filter, TrendingUp
} from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { cn } from "@/lib/utils"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { ExecutiveJobCard } from "@/components/executive-job-card"

function formatLastUpdated(date: Date | null) {
  if (!date) return "Never"
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export default function EmployeeJobsPage() {
  const { jobs: allJobs, refreshJobs } = useJobs()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "completed" | "all">("active")
  const [searchTerm, setSearchTerm] = useState("")

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const isRefreshingRef = useRef(false)

  // Scope jobs to employee
  const jobs = currentUser?.role === "employee"
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
        message: err.message || "There was a problem connecting to the server. Please try again.",
      })
    } finally {
      setIsRefreshing(false)
      isRefreshingRef.current = false
    }
  }, [refreshJobs])

  useEffect(() => {
    handleRefresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter jobs by search and view tab
  const filteredJobs = jobs.filter((job: any) => {
    const status = (job.status || "open").toLowerCase()
    const empStatus = (job.employee_status || "pending").toLowerCase()

    if (activeTab === "active" && (empStatus === "declined" || status === "completed")) return false
    if (activeTab === "pending" && empStatus !== "pending") return false
    if (activeTab === "completed" && status !== "completed") return false

    const matchesSearch =
      (job.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.location || "").toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const activeCount = jobs.filter((j: any) => j.employee_status === "accepted" || j.status === "in_progress").length
  const pendingCount = jobs.filter((j: any) => j.employee_status === "pending" || !j.employee_status).length
  const completedCount = jobs.filter((j: any) => j.status === "completed").length

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">My Assigned Tasks & Jobs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review field assignments, update execution progress, log work notes, and raise material requests.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[10px] text-muted-foreground hidden lg:flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3 text-primary" />
              LAST SYNC: {formatLastUpdated(lastUpdated)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 text-xs font-bold rounded-xl"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />
              Refresh Tasks
            </Button>
          </div>
        </div>

        {/* Executive View Switcher Toolbar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-card rounded-2xl border border-border/70 shadow-xs overflow-x-auto no-scrollbar">
          <Button
            variant={activeTab === "active" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "active" && "shadow-xs")}
            onClick={() => setActiveTab("active")}
          >
            <Briefcase className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            Active Tasks ({activeCount})
          </Button>

          <Button
            variant={activeTab === "pending" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 text-xs font-bold rounded-xl px-3.5 relative",
              activeTab === "pending" ? "bg-amber-600 text-white hover:bg-amber-700 shadow-xs" : "text-amber-600 hover:bg-amber-50 dark:text-amber-400"
            )}
            onClick={() => setActiveTab("pending")}
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            Pending Acceptance
            {pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse">
                {pendingCount}
              </span>
            )}
          </Button>

          <Button
            variant={activeTab === "completed" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "completed" && "shadow-xs")}
            onClick={() => setActiveTab("completed")}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 shrink-0 text-emerald-500" />
            Completed ({completedCount})
          </Button>

          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "all" && "shadow-xs")}
            onClick={() => setActiveTab("all")}
          >
            All Tasks ({jobs.length})
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search assigned tasks by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        {/* Task Cards Grid */}
        {isRefreshing && jobs.length === 0 ? (
          <SkeletonList count={4} />
        ) : error && jobs.length === 0 ? (
          <ErrorView title={error.title} message={error.message} onRetry={handleRefresh} />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No tasks found"
            description="No assigned tasks match your selected view tab or search query."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredJobs.map((job: any) => (
              <ExecutiveJobCard
                key={job.id}
                job={job}
                role="employee"
                onActionComplete={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  )
}
