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
  XCircle, AlertCircle, TrendingUp, Edit, Trash2, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

  // ── Refresh state ─────────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isRefreshingRef = useRef(false) // guard against duplicate concurrent calls

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return // duplicate call guard
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      await refreshJobs()
      setLastUpdated(new Date())
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
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Job Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage projects and track employee responses</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Last Updated */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated: {formatLastUpdated(lastUpdated)}</span>
            </div>

            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
              title="Refresh jobs"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </Button>

            <ExportButton
              filename="Jobs_Status_Report"
              title="Project Jobs Report"
              subtitle={`Detailed Project Execution Analysis`}
              onExport={async () => {
                const data = await apiClient("/api/jobs")
                return Array.isArray(data) ? data.map((j: any) => ({
                  ...j,
                  progress_text: `${j.progress || 0}%`
                })) : []
              }}
              columns={[
                { header: "Job Title", dataKey: "title" },
                { header: "Status", dataKey: "status" },
                { header: "Client", dataKey: "client" },
                { header: "Location", dataKey: "location" },
                { header: "Assigned To", dataKey: "employee_email" },
                { header: "Employee Resp.", dataKey: "employee_status" },
                { header: "Progress", dataKey: "progress_text", type: "number" },
                { header: "Deadline", dataKey: "deadline", type: "date" },
                { header: "Created Date", dataKey: "created_at", type: "date" }
              ]}
            />

            <Button onClick={handleCreateJob} size="lg">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-700">{acceptedJobs}</div>
                  <div className="text-xs text-green-600 font-medium">Accepted by Employees</div>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-700">{pendingJobs}</div>
                  <div className="text-xs text-yellow-600 font-medium">Awaiting Response</div>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-700">{completedJobs}</div>
                  <div className="text-xs text-blue-600 font-medium">Completed Jobs</div>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-700">{declinedJobs}</div>
                  <div className="text-xs text-red-600 font-medium">Declined by Employees</div>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
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

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const employeeStatus = job.employee_status || "pending"
            const progress = job.progress || 0
            const isCompleted = job.status?.toLowerCase() === "completed"

            return (
              <Card
                key={job.id}
                className={cn(
                  "group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2",
                  employeeStatus === "accepted" && "border-green-100",
                  employeeStatus === "declined" && "border-red-100 opacity-75",
                  (employeeStatus === "pending" || employeeStatus === "assigned" || !employeeStatus) && "border-yellow-100"
                )}
              >
                <div
                  className={cn(
                    "h-2 w-full",
                    isCompleted && "bg-green-500",
                    !isCompleted && employeeStatus === "accepted" && "bg-blue-500",
                    (employeeStatus === "pending" || employeeStatus === "assigned" || !employeeStatus) && "bg-yellow-500",
                    employeeStatus === "declined" && "bg-red-500"
                  )}
                />
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{job.title}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditJob(job)} className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" onClick={() => handleDeleteJob(job)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={job.status === "completed" ? "default" : "outline"}>
                      {job.status || "pending"}
                    </Badge>
                    {getEmployeeStatusBadge(employeeStatus)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {job.description || "No description"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {employeeStatus === "accepted" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Progress</span>
                        <span className="font-bold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2.5" />
                      {isCompleted && (
                        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed on {formatDate(job.completed_at)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 text-xs text-muted-foreground">
                    {((job as any).employee_name || job.employee_email) && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>Assigned to: <span className="font-semibold text-foreground">{(job as any).employee_name || job.employee_email}</span></span>
                      </div>
                    )}
                    {job.employee_email && (job as any).employee_name && (
                      <div className="flex items-center gap-2 pl-5">
                        <span className="text-muted-foreground/70">{job.employee_email}</span>
                      </div>
                    )}
                    {job.accepted_at && (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Accepted: {formatDate(job.accepted_at)}</span>
                      </div>
                    )}
                    {job.declined_at && (
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="w-3 h-3" />
                        <span>Declined: {formatDate(job.declined_at)}</span>
                      </div>
                    )}
                    {!job.accepted_at && !job.declined_at && employeeStatus === "pending" && (
                      <div className="flex items-center gap-2 text-yellow-700">
                        <AlertCircle className="w-3 h-3" />
                        <span>Waiting for employee response</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="w-3 h-3" />
                    <span>Created: {formatDate(job.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredJobs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No jobs found</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Try adjusting your filters or create a new job
              </p>
            </CardContent>
          </Card>
        )}

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
