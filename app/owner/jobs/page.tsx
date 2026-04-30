"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { JobForm } from "@/components/job-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Job } from "@/lib/data"
import { useJobs } from "@/contexts/job-context"
import { ExportButton } from "@/components/export-button"
import { apiClient } from "@/lib/apiClient"
import {
  Plus, Search, Filter, Calendar, Users, CheckCircle2, Clock,
  XCircle, AlertCircle, TrendingUp, Edit, Trash2, RefreshCw, Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList } from "@/components/ui/skeleton-card"

const AUTO_REFRESH_MS = 30_000

function formatDate(dateString?: string) {
  if (!dateString) return "Not set"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return "Invalid date"
  }
}

function formatLastUpdated(date: Date | null) {
  if (!date) return "Never"
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function getEmployeeStatusBadge(employeeStatus?: string) {
  const status = employeeStatus?.toLowerCase() || "pending"
  switch (status) {
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />Accepted
        </Badge>
      )
    case "declined":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" />Declined
        </Badge>
      )
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="w-3 h-3 mr-1" />Pending
        </Badge>
      )
  }
}

export default function OwnerJobsPage() {
  const { jobs, addJob, updateJob, deleteJob, refreshJobs } = useJobs()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)

  // ── Refresh state ─────────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isRefreshingRef = useRef(false) // guard against duplicate concurrent calls

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return // duplicate call guard
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      setError(null)
      await refreshJobs()
      setLastUpdated(new Date())
    } catch (err: any) {
      setError({
        title: "Could not load jobs",
        message: err.message || "Something went wrong while fetching the projects. Please check your connection."
      })
    } finally {
      setIsRefreshing(false)
      isRefreshingRef.current = false
    }
  }, [refreshJobs])

  // Initial fetch + 30-second auto-refresh with proper cleanup
  useEffect(() => {
    handleRefresh()
    const intervalId = setInterval(handleRefresh, AUTO_REFRESH_MS)
    return () => clearInterval(intervalId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesPriority = priorityFilter === "all" || job.priority === priorityFilter
    const matchesEmployeeStatus = employeeStatusFilter === "all" || job.employee_status === employeeStatusFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesEmployeeStatus
  })

  // ── Job CRUD handlers ─────────────────────────────────────────────────────
  const handleCreateJob = () => { setEditingJob(null); setIsFormOpen(true) }
  const handleEditJob = (job: Job) => { setEditingJob(job); setIsFormOpen(true) }
  const handleDeleteJob = (job: Job) => {
    if (confirm("Are you sure you want to delete this job?")) deleteJob(job.id)
  }
  const handleSubmitJob = async (jobData: Partial<Job>) => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    if (editingJob) {
      updateJob(editingJob.id, jobData)
    } else {
      addJob({ id: Date.now().toString(), spent: 0, ...jobData } as Job)
    }
    setIsSubmitting(false)
    setIsFormOpen(false)
    setEditingJob(null)
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const acceptedJobs = jobs.filter(j => j.employee_status === "accepted").length
  const pendingJobs = jobs.filter(j => j.employee_status === "pending").length
  const declinedJobs = jobs.filter(j => j.employee_status === "declined").length
  const completedJobs = jobs.filter(j => j.status === "completed").length

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Job <span className="text-primary">Management</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-normal">
              Monitor project lifecycles, track employee availability, and drive operational excellence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-0.5 text-right mr-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Auto-refresh Active</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatLastUpdated(lastUpdated)}
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 h-10 px-4 btn-premium"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing" : "Refresh"}
            </Button>

            <Button onClick={handleCreateJob} size="lg" className="h-10 px-6 shadow-lg shadow-primary/20 btn-premium">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        </div>

        {/* Mobile Last Updated */}
        <p className="sm:hidden text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last updated: {formatLastUpdated(lastUpdated)}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Accepted", value: acceptedJobs, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20" },
            { label: "Pending", value: pendingJobs, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
            { label: "Completed", value: completedJobs, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Declined", value: declinedJobs, icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20" },
          ].map((stat, i) => (
            <Card key={i} className={cn("premium-card hover-lift-subtle border", stat.border)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  </div>
                  <div className={cn("p-3 rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, clients, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={employeeStatusFilter} onValueChange={setEmployeeStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Employee Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Responses</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6">
          {isRefreshing && jobs.length === 0 ? (
            <SkeletonList count={6} />
          ) : error && jobs.length === 0 ? (
            <ErrorView title={error.title} message={error.message} onRetry={handleRefresh} />
          ) : filteredJobs.length === 0 ? (
            <EmptyState 
              icon={Briefcase}
              title="No jobs found"
              description="We couldn't find any jobs matching your current filters. Try adjusting them or create a new project."
              actionLabel="Create New Job"
              onAction={handleCreateJob}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredJobs.map((job) => {
                const employeeStatus = job.employee_status || "pending"
                const empStatusStr = String(employeeStatus)
                const isCompleted = job.status?.toLowerCase() === "completed"
                const displayProgress = isCompleted ? 100 : (job.progress || 0)

                const accentColor = isCompleted
                  ? "bg-emerald-500"
                  : empStatusStr === "accepted" ? "bg-primary"
                  : empStatusStr === "declined" ? "bg-red-400"
                  : "bg-amber-400"

                return (
                  <div
                    key={job.id}
                    className="group relative bg-card rounded-xl border border-border hover:border-primary/25 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    {/* Accent bar */}
                    <div className={cn("h-[3px] w-full shrink-0", accentColor)} />

                    <div className="p-5 flex flex-col flex-1 gap-4">
                      {/* Top row: status badge + actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide",
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : job.status === "active" || job.status === "in_progress"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {job.status || "pending"}
                          </span>
                          {job.priority && (
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium capitalize",
                              job.priority === "high" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                              : job.priority === "medium" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                            )}>
                              {job.priority}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleEditJob(job)} className="h-7 w-7 rounded-lg hover:bg-primary/8 hover:text-primary">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteJob(job)} className="h-7 w-7 rounded-lg hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Title + description */}
                      <div>
                        <h3
                          className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors cursor-pointer line-clamp-1"
                          onClick={() => handleEditJob(job)}
                        >
                          {job.title}
                        </h3>
                        {job.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-normal">
                            {job.description}
                          </p>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground/50">Progress</span>
                          <span className="text-xs font-semibold text-primary">{displayProgress}%</span>
                        </div>
                        <Progress value={displayProgress} className="h-1.5 rounded-full" />
                      </div>

                      {/* Footer: assignee + deadline */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                            {(job as any).employee_name?.[0]?.toUpperCase() || job.employee_email?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-xs text-muted-foreground truncate max-w-[110px] font-normal">
                            {(job as any).employee_name || job.employee_email || "Unassigned"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-normal shrink-0">
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.deadline).split(',')[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Job Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? "Edit Job" : "Create New Job"}</DialogTitle>
              <DialogDescription>
                {editingJob
                  ? "Update the details and assignments for this existing job."
                  : "Fill out the form below to create a new job and assign it to employees."}
              </DialogDescription>
            </DialogHeader>
            <JobForm
              job={editingJob || undefined}
              onSubmit={handleSubmitJob}
              onCancel={() => { setIsFormOpen(false); setEditingJob(null) }}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
