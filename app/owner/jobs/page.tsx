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
  MapPin, User, Zap, ArrowUpCircle, Minus, ArrowDownCircle, Hash,
  ChevronRight, MessageSquare, Eye,
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

function getEmployeeStatusBadge(employeeStatus?: string | null) {
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

            <ExportButton
              filename="Jobs_Report"
              title="Jobs & Projects Report"
              subtitle="Operational Job Lifecycle Overview"
              onExport={async () => {
                const data = await apiClient("/api/jobs")
                return Array.isArray(data)
                  ? data.map((j: any) => ({
                      ...j,
                      employee: (j as any).employee_name || j.employee_email || "Unassigned",
                      deadline_fmt: j.deadline
                        ? new Date(j.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                        : "Not set",
                      progress_pct: `${j.progress || 0}%`,
                    }))
                  : []
              }}
              columns={[
                { header: "Job Title",      dataKey: "title" },
                { header: "Status",         dataKey: "status",        type: "status" },
                { header: "Priority",       dataKey: "priority",      type: "priority" },
                { header: "Progress",       dataKey: "progress_pct" },
                { header: "Assigned To",    dataKey: "employee" },
                { header: "Client",         dataKey: "client" },
                { header: "Location",       dataKey: "location" },
                { header: "Due Date",       dataKey: "deadline_fmt" },
                { header: "Created",        dataKey: "created_at",    type: "date" },
              ]}
            />

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => {
                const employeeStatus = job.employee_status
                const empStatusStr = String(employeeStatus || "")
                const isCompleted  = job.status?.toLowerCase() === "completed"
                const isInProgress = job.status?.toLowerCase() === "in_progress" || job.status?.toLowerCase() === "active"
                const isCancelled  = job.status?.toLowerCase() === "cancelled"
                const displayProgress = isCompleted ? 100 : (job.progress || 0)

                // ── Status colour strip ───────────────────────────────────
                const stripColor =
                  isCompleted              ? "bg-green-500"  :
                  isCancelled             ? "bg-gray-400"   :
                  isInProgress            ? "bg-orange-500" :
                  empStatusStr === "accepted"  ? "bg-blue-500"  :
                  empStatusStr === "declined"  ? "bg-red-500"   :
                  empStatusStr === "arrived"   ? "bg-teal-500"  :
                                                "bg-amber-400"

                // ── Job status badge ──────────────────────────────────────
                const statusBadge = (() => {
                  const s = (job.status || "").toLowerCase()
                  if (s === "completed")  return { label: "Completed",  cls: "bg-green-50  text-green-700  ring-1 ring-green-200",  dot: "bg-green-500" }
                  if (s === "in_progress" || s === "active") return { label: "In Progress", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200", dot: "bg-orange-500 animate-pulse" }
                  if (s === "cancelled")  return { label: "Cancelled",  cls: "bg-gray-100   text-gray-500   ring-1 ring-gray-200",   dot: "bg-gray-400" }
                  if (s === "open")       return { label: "Open",       cls: "bg-blue-50   text-blue-700   ring-1 ring-blue-200",   dot: "bg-blue-500" }
                  return                         { label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " "),
                                                  cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200",  dot: "bg-amber-500 animate-pulse" }
                })()

                // ── Employee status badge ─────────────────────────────────
                const empBadge = (() => {
                  switch (empStatusStr) {
                    case "accepted":  return { label: "Tech Accepted",  cls: "bg-green-50  text-green-700  ring-1 ring-green-200" }
                    case "arrived":   return { label: "On Site",        cls: "bg-teal-50   text-teal-700   ring-1 ring-teal-200" }
                    case "declined":  return { label: "Declined",       cls: "bg-red-50    text-red-700    ring-1 ring-red-200" }
                    case "completed": return { label: "Tech Done",      cls: "bg-blue-50   text-blue-700   ring-1 ring-blue-200" }
                    default:          return { label: "Pending",        cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200" }
                  }
                })()

                // ── Priority icon + colour ────────────────────────────────
                const priorityMeta = (() => {
                  switch ((job.priority || "").toLowerCase()) {
                    case "urgent": return { label: "Urgent", cls: "text-red-600    bg-red-50    ring-1 ring-red-200",    Icon: Zap }
                    case "high":   return { label: "High",   cls: "text-orange-600 bg-orange-50 ring-1 ring-orange-200", Icon: ArrowUpCircle }
                    case "low":    return { label: "Low",    cls: "text-gray-500   bg-gray-100  ring-1 ring-gray-200",   Icon: ArrowDownCircle }
                    default:       return { label: "Medium", cls: "text-blue-600   bg-blue-50   ring-1 ring-blue-200",   Icon: Minus }
                  }
                })()

                // ── Progress bar colour ───────────────────────────────────
                const progressColor =
                  displayProgress === 100 ? "bg-green-500" :
                  displayProgress >= 70   ? "bg-blue-500"  :
                  displayProgress >= 40   ? "bg-orange-400" : "bg-amber-400"

                const techName  = (job as any).employee_name || job.employee_email || null
                const shortId   = job.id.slice(-6).toUpperCase()

                return (
                  <div
                    key={job.id}
                    className="group relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] flex flex-col"
                  >
                    {/* ── Top status strip ─────────────────────────────── */}
                    <div className={cn("h-0.5 w-full", stripColor)} />

                    <div className="p-5 flex flex-col flex-1">

                      {/* ── Row 1: ID + status badges + actions ──────── */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Short ID */}
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-gray-400">
                            <Hash className="h-2.5 w-2.5" />{shortId}
                          </span>
                          {/* Job status */}
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", statusBadge.cls)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusBadge.dot)} />
                            {statusBadge.label}
                          </span>
                          {/* Priority */}
                          <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold", priorityMeta.cls)}>
                            <priorityMeta.Icon className="h-2.5 w-2.5" />
                            {priorityMeta.label}
                          </span>
                        </div>

                        {/* Edit / Delete — appear on hover */}
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditJob(job)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* ── Row 2: Title ─────────────────────────────── */}
                      <button
                        className="text-left mb-1"
                        onClick={() => handleEditJob(job)}
                      >
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                          {job.title}
                        </h3>
                      </button>

                      {/* Description */}
                      {job.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mb-3">
                          {job.description}
                        </p>
                      )}

                      {/* ── Row 3: Client + Location ─────────────────── */}
                      <div className="flex flex-col gap-1 mb-3">
                        {job.client && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <Users className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-700 truncate">{job.client}</span>
                          </div>
                        )}
                        {job.location && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        )}
                      </div>

                      {/* ── Row 4: Progress bar ──────────────────────── */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
                          <span className="font-semibold uppercase tracking-wider">Progress</span>
                          <span className={cn(
                            "font-bold text-xs",
                            displayProgress === 100 ? "text-green-600" : "text-blue-600"
                          )}>{displayProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", progressColor)}
                            style={{ width: `${displayProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* ── Row 5: Tech + Employee status + Timeline ─── */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800 mt-auto">
                        {/* Technician */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                            {techName?.[0]?.toUpperCase() || <User className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Technician</p>
                            <p className="text-xs font-semibold text-gray-700 truncate max-w-[90px]">
                              {techName || "Unassigned"}
                            </p>
                          </div>
                        </div>

                        {/* Employee status badge */}
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold", empBadge.cls)}>
                          {empBadge.label}
                        </span>

                        {/* Deadline */}
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Due</p>
                          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-600">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {job.deadline
                              ? new Date(job.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                              : <span className="text-gray-400">Not set</span>}
                          </div>
                        </div>
                      </div>

                      {/* ── Row 6: Action buttons ─────────────────────── */}
                      <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors shadow-sm shadow-blue-200"
                        >
                          <Eye className="h-3 w-3" />
                          View / Edit
                        </button>
                        {!isCompleted && !isCancelled && (
                          <button
                            onClick={() => handleDeleteJob(job)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold ring-1 ring-red-200 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        )}
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto" />
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
