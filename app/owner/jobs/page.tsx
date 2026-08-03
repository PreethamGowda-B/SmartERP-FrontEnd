"use client"

import { useState, useCallback, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { JobForm } from "@/components/job-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Job } from "@/lib/data"
import { useJobs } from "@/contexts/job-context"
import { ExportButton } from "@/components/export-button"
import { apiClient } from "@/lib/apiClient"
import {
  Plus, Search, Filter, CheckCircle2, Clock,
  XCircle, TrendingUp, RefreshCw, Briefcase, Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { ExecutiveJobCard } from "@/components/executive-job-card"
import { ApprovalCenterView } from "@/components/approval-center-view"

const AUTO_REFRESH_MS = 30_000

function formatLastUpdated(date: Date | null) {
  if (!date) return "Never"
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function OwnerJobsPageContent() {
  const { jobs, addJob, updateJob, deleteJob, refreshJobs } = useJobs()
  const searchParams = useSearchParams()

  // Tab switcher state: all | customer | approvals | completed | archived
  const initialView = searchParams.get("view") === "approvals" ? "approvals" : "all"
  const [activeTab, setActiveTab] = useState<"all" | "customer" | "approvals" | "completed" | "archived">(initialView as any)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isRefreshingRef = useRef(false)

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await apiClient("/api/work-requests?status=pending")
      if (res?.success) {
        setPendingRequestsCount(res.requests?.length || 0)
      }
    } catch (_) {}
  }, [])

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      setError(null)
      await refreshJobs()
      await fetchPendingCount()
      setLastUpdated(new Date())
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError({
          title: "Failed to Refresh Jobs",
          message: err.message || "An unexpected error occurred while fetching your jobs. Please try again.",
        })
      }
    } finally {
      setIsRefreshing(false)
      isRefreshingRef.current = false
    }
  }, [refreshJobs, fetchPendingCount])

  useEffect(() => {
    handleRefresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateJob = () => {
    setEditingJob(null)
    setIsFormOpen(true)
  }

  const handleEditJob = (job: Job) => {
    setEditingJob(job)
    setIsFormOpen(true)
  }

  const handleDeleteJob = async (job: Job) => {
    if (confirm(`Are you sure you want to delete "${job.title}"?`)) {
      try {
        await deleteJob(job.id)
        setLastUpdated(new Date())
      } catch (err: any) {
        setError({
          title: "Failed to Delete Job",
          message: err.message || "Could not delete the job. Please try again.",
        })
      }
    }
  }

  const handleSubmitJob = async (jobData: Partial<Job>) => {
    setIsSubmitting(true)
    try {
      if (editingJob) {
        await updateJob(editingJob.id, jobData)
      } else {
        await addJob(jobData as Job)
      }
      setIsFormOpen(false)
      setEditingJob(null)
      setLastUpdated(new Date())
    } catch (err: any) {
      setError({
        title: editingJob ? "Failed to Update Job" : "Failed to Create Job",
        message: err.message || "An error occurred while saving the job. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkIsCustomerJob = (j: any) => Boolean(j?.is_customer_job || j?.source === "customer" || j?.source === "customer_portal" || j?.created_by_role === "customer" || j?.customer_id)

  // Filter jobs by search, filters, and active tab
  const filteredJobs = jobs.filter((job) => {
    const isCust = checkIsCustomerJob(job)
    const isCompleted = job.status?.toLowerCase() === "completed"

    if (activeTab === "customer" && !isCust) return false
    if (activeTab === "completed" && !isCompleted) return false
    if (activeTab === "archived" && job.status?.toLowerCase() !== "cancelled") return false

    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job as any).client?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || job.status?.toLowerCase() === statusFilter.toLowerCase()
    const matchesEmployeeStatus =
      employeeStatusFilter === "all" ||
      job.employee_status?.toLowerCase() === employeeStatusFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesEmployeeStatus
  })

  const acceptedJobs = jobs.filter((j) => j.employee_status?.toLowerCase() === "accepted").length
  const pendingJobs = jobs.filter((j) => j.employee_status?.toLowerCase() === "pending" || !j.employee_status).length
  const completedJobs = jobs.filter((j) => j.status?.toLowerCase() === "completed").length
  const declinedJobs = jobs.filter((j) => j.employee_status?.toLowerCase() === "declined").length
  const customerJobsCount = jobs.filter(checkIsCustomerJob).length

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Task & Job Operations</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor field lifecycles, action team requests, and drive operational excellence.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[10px] text-muted-foreground hidden lg:flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3 text-primary" />
              AUTO-REFRESH: {formatLastUpdated(lastUpdated)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 text-xs font-bold rounded-xl"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>

            <ExportButton
              title="Job Management Report"
              filename="smarterp-jobs-export"
              data={filteredJobs}
              columns={[
                { header: "Job Title", dataKey: "title" },
                { header: "Location", dataKey: "location" },
                { header: "Status", dataKey: "status", type: "status" },
                { header: "Priority", dataKey: "priority", type: "priority" },
                { header: "Progress", dataKey: "progress", type: "number" },
                { header: "Budget", dataKey: "budget", type: "currency" },
              ]}
            />

            <Button onClick={handleCreateJob} size="sm" className="h-9 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              New Job
            </Button>
          </div>
        </div>

        {/* Executive View Switcher Toolbar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-card rounded-2xl border border-border/70 shadow-xs overflow-x-auto no-scrollbar">
          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "all" && "shadow-xs")}
            onClick={() => setActiveTab("all")}
          >
            All Jobs ({jobs.length})
          </Button>

          <Button
            variant={activeTab === "customer" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "customer" && "shadow-xs")}
            onClick={() => setActiveTab("customer")}
          >
            Customer Requests ({customerJobsCount})
          </Button>

          <Button
            variant={activeTab === "approvals" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 text-xs font-bold rounded-xl px-3.5 relative",
              activeTab === "approvals" ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs" : "text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400"
            )}
            onClick={() => setActiveTab("approvals")}
          >
            <Zap className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            Approval Center
            {pendingRequestsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </Button>

          <Button
            variant={activeTab === "completed" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "completed" && "shadow-xs")}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({completedJobs})
          </Button>

          <Button
            variant={activeTab === "archived" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "archived" && "shadow-xs")}
            onClick={() => setActiveTab("archived")}
          >
            Archived
          </Button>
        </div>

        {/* ── TAB CONTENT ── */}
        {activeTab === "approvals" ? (
          <ApprovalCenterView initialCategory={searchParams.get("category") || "all"} />
        ) : (
          <>
            {/* KPI Stats Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Accepted Jobs", value: acceptedJobs, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
                { label: "Pending Acceptance", value: pendingJobs, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
                { label: "Completed", value: completedJobs, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
                { label: "Declined Jobs", value: declinedJobs, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/40" },
              ].map((stat, i) => (
                <Card key={i} className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">{stat.label}</p>
                      <div className="text-2xl font-black tracking-tight text-foreground mt-0.5">{stat.value}</div>
                    </div>
                    <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, clients, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36 h-9 text-xs rounded-xl">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Job Grid */}
            {isRefreshing && jobs.length === 0 ? (
              <SkeletonList count={6} />
            ) : error && jobs.length === 0 ? (
              <ErrorView title={error.title} message={error.message} onRetry={handleRefresh} />
            ) : filteredJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No jobs found"
                description="We couldn't find any jobs matching your current view or filters. Try adjusting them or create a new project."
                actionLabel="Create New Job"
                onAction={handleCreateJob}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredJobs.map((job) => (
                  <ExecutiveJobCard
                    key={job.id}
                    job={{
                      ...job,
                      invoice: (job as any).invoice_number ? {
                        id: (job as any).invoice_id,
                        invoice_number: (job as any).invoice_number,
                        total_amount: (job as any).invoice_total_amount || job.budget || 0,
                        status: (job as any).invoice_status || 'sent',
                        viewed_at: (job as any).invoice_viewed_at,
                        downloaded_at: (job as any).invoice_downloaded_at,
                      } : null,
                    }}
                    role="owner"
                    onEdit={handleEditJob}
                    onDelete={handleDeleteJob}
                    onView={(j) => handleEditJob(j)}
                    onActionComplete={handleRefresh}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Job Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-xl">{editingJob ? "Edit Job Parameters" : "Create New Enterprise Job"}</DialogTitle>
              <DialogDescription className="text-xs">
                {editingJob
                  ? "Update job details, SLA parameters, and technician assignments."
                  : "Fill out the form below to initiate a job and dispatch it to technicians."}
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

export default function OwnerJobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">Loading jobs...</div>}>
      <OwnerJobsPageContent />
    </Suspense>
  )
}

