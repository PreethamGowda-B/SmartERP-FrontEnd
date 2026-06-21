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
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Job <span className="text-primary">Management</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredJobs.map((job) => {
                const employeeStatus = job.employee_status
                const empStatusStr = String(employeeStatus)
                const isCompleted = job.status?.toLowerCase() === "completed"
                const isInProgress = job.status?.toLowerCase() === "in_progress"
                const displayProgress = isCompleted ? 100 : (job.progress || 0)

                return (
                  <Card
                    key={job.id}
                    className="premium-card hover-lift group overflow-hidden border-none shadow-sm hover:shadow-xl"
                  >
                    <div className={cn(
                      "h-1.5 w-full",
                      isCompleted ? "bg-green-500" : 
                      empStatusStr === "accepted" ? "bg-primary" : 
                      empStatusStr === "declined" ? "bg-red-500" : "bg-yellow-500"
                    )} />
                    
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0">
                          {job.status}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleEditJob(job)} className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteJob(job)} className="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleEditJob(job)}>
                        {job.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-3">
                        {getEmployeeStatusBadge(employeeStatus)}
                        <span className="text-meta">ID: {job.id.substring(0, 8)}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 pt-0 space-y-6">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {job.description || "Project parameters and execution details have been formalized for this assignment."}
                      </p>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Execution Progress</span>
                          <span className="text-sm font-black text-primary">{displayProgress}%</span>
                        </div>
                        <Progress value={displayProgress} className="h-2 bg-secondary rounded-full overflow-hidden" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Technician</p>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                              {(job as any).employee_name?.[0] || job.employee_email?.[0] || "?"}
                            </div>
                            <p className="text-xs font-semibold truncate max-w-[100px]">
                              {(job as any).employee_name || job.employee_email || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Timeline</p>
                          <div className="flex items-center justify-end gap-1.5 text-xs font-semibold">
                            <Calendar className="h-3 w-3 text-primary" />
                            {formatDate(job.deadline).split(',')[0]}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
