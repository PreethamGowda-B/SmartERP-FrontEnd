"use client"

import { useState, useCallback, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { apiClient } from "@/lib/apiClient"
import {
  Search, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle,
  User, Building2, Calendar, ChevronRight, Filter, UserCheck, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomerJob {
  id: string
  title: string
  description?: string
  priority: string
  approval_status: string
  status: string
  employee_status: string
  created_at: string
  approved_at?: string
  rejected_at?: string
  assigned_at?: string
  completed_at?: string
  customer_name?: string
  customer_email?: string
  customer_company_name?: string
  assigned_employee_name?: string
  ai_suggested_priority?: string
  sla_accept_breached?: boolean
  sla_completion_breached?: boolean
}

function formatDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const APPROVAL_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending_approval: { label: "Pending Review", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  approved:         { label: "Approved",        className: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2 },
  rejected:         { label: "Not Approved",    className: "bg-red-50 text-red-700 border-red-200",        icon: XCircle },
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low:    { label: "Low",    className: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", className: "bg-blue-50 text-blue-700" },
  high:   { label: "High",   className: "bg-orange-50 text-orange-700" },
  urgent: { label: "Urgent", className: "bg-red-50 text-red-700" },
}

export default function HRCustomerJobsPage() {
  const [jobs, setJobs] = useState<CustomerJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [approvalFilter, setApprovalFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedJob, setSelectedJob] = useState<CustomerJob | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  const fetchJobs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      if (approvalFilter !== "all") params.set("approval_status", approvalFilter)
      if (priorityFilter !== "all") params.set("priority", priorityFilter)
      const data = await apiClient(`/api/v1/customer-jobs?${params}`)
      if (data?.success) setJobs(data.data.jobs || [])
    } catch {}
    finally { setIsLoading(false); setIsRefreshing(false) }
  }, [approvalFilter, priorityFilter])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleApprove = async (jobId: string) => {
    setActionLoading(jobId + "_approve"); setActionError("")
    try {
      const data = await apiClient(`/api/v1/customer-jobs/${jobId}/approve`, { method: "POST" })
      if (data?.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, approval_status: "approved", approved_at: new Date().toISOString() } : j))
        if (selectedJob?.id === jobId) setSelectedJob(prev => prev ? { ...prev, approval_status: "approved" } : prev)
      } else { setActionError(data?.error || "Failed to approve") }
    } catch (err: any) { setActionError(err?.error || err?.message || "Failed to approve") }
    finally { setActionLoading(null) }
  }

  const handleReject = async (jobId: string) => {
    setActionLoading(jobId + "_reject"); setActionError("")
    try {
      const data = await apiClient(`/api/v1/customer-jobs/${jobId}/reject`, { method: "POST", body: JSON.stringify({}) })
      if (data?.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, approval_status: "rejected", rejected_at: new Date().toISOString() } : j))
        if (selectedJob?.id === jobId) setSelectedJob(prev => prev ? { ...prev, approval_status: "rejected" } : prev)
      } else { setActionError(data?.error || "Failed to reject") }
    } catch (err: any) { setActionError(err?.error || err?.message || "Failed to reject") }
    finally { setActionLoading(null) }
  }

  const filtered = jobs.filter(j => {
    const q = searchTerm.toLowerCase()
    return !q || j.title?.toLowerCase().includes(q) || j.customer_name?.toLowerCase().includes(q) || j.customer_company_name?.toLowerCase().includes(q)
  })

  const pending  = jobs.filter(j => j.approval_status === "pending_approval").length
  const approved = jobs.filter(j => j.approval_status === "approved").length
  const rejected = jobs.filter(j => j.approval_status === "rejected").length

  return (
    <HRLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-5 w-5 text-primary" />
              <h1 className="text-3xl font-black">Customer <span className="text-primary">Jobs</span></h1>
            </div>
            <p className="text-muted-foreground font-medium">Review and approve service requests submitted by customers</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchJobs(true)} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-amber-500/5">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Pending</p>
                <p className="text-3xl font-black text-amber-700">{pending}</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-2xl"><Clock className="h-5 w-5 text-amber-600" /></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-green-500/5">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Approved</p>
                <p className="text-3xl font-black text-green-700">{approved}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-2xl"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-500/5">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Rejected</p>
                <p className="text-3xl font-black text-red-700">{rejected}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-2xl"><XCircle className="h-5 w-5 text-red-600" /></div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by job title, customer, or company..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-11 rounded-xl border-2" />
          </div>
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl border-2 font-bold">
              <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Not Approved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-36 h-11 rounded-xl border-2 font-bold">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <UserCheck className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="font-bold text-muted-foreground">No customer jobs found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Customer-submitted jobs will appear here for review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(job => {
              const approval = APPROVAL_CONFIG[job.approval_status] || APPROVAL_CONFIG.pending_approval
              const ApprovalIcon = approval.icon
              const priority = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.medium
              const isPending = job.approval_status === "pending_approval"

              return (
                <div
                  key={job.id}
                  className={cn(
                    "bg-card border-2 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer",
                    isPending && "border-amber-200 bg-amber-50/20",
                    job.approval_status === "approved" && "border-green-100",
                    job.approval_status === "rejected" && "border-red-100 opacity-80",
                  )}
                  onClick={() => { setSelectedJob(job); setActionError("") }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-bold text-sm truncate">{job.title}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${priority.className}`}>{priority.label}</span>
                        {job.ai_suggested_priority && job.ai_suggested_priority !== job.priority && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold">
                            <Zap className="h-3 w-3" />AI: {job.ai_suggested_priority}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {job.customer_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{job.customer_name}</span>}
                        {job.customer_company_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.customer_company_name}</span>}
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(job.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${approval.className}`}>
                        <ApprovalIcon className="h-3 w-3" />{approval.label}
                      </span>
                      {isPending && (
                        <>
                          <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white gap-1 rounded-xl"
                            onClick={e => { e.stopPropagation(); handleApprove(job.id) }}
                            disabled={actionLoading === job.id + "_approve"}>
                            {actionLoading === job.id + "_approve" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-600 hover:bg-red-50 gap-1 rounded-xl"
                            onClick={e => { e.stopPropagation(); handleReject(job.id) }}
                            disabled={actionLoading === job.id + "_reject"}>
                            {actionLoading === job.id + "_reject" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                            Reject
                          </Button>
                        </>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Detail dialog */}
        <Dialog open={!!selectedJob} onOpenChange={open => !open && setSelectedJob(null)}>
          <DialogContent className="max-w-lg rounded-2xl">
            {selectedJob && (() => {
              const approval = APPROVAL_CONFIG[selectedJob.approval_status] || APPROVAL_CONFIG.pending_approval
              const ApprovalIcon = approval.icon
              const priority = PRIORITY_CONFIG[selectedJob.priority] || PRIORITY_CONFIG.medium
              const isPending = selectedJob.approval_status === "pending_approval"
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedJob.title}</DialogTitle>
                    <DialogDescription>Customer job request details</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${approval.className}`}>
                        <ApprovalIcon className="h-3 w-3" />{approval.label}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${priority.className}`}>{priority.label}</span>
                    </div>
                    {selectedJob.description && (
                      <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-3">{selectedJob.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-muted-foreground mb-0.5">Customer</p><p className="font-bold">{selectedJob.customer_name || "—"}</p></div>
                      <div><p className="text-xs text-muted-foreground mb-0.5">Company</p><p className="font-bold">{selectedJob.customer_company_name || "—"}</p></div>
                      <div><p className="text-xs text-muted-foreground mb-0.5">Submitted</p><p className="font-bold">{formatDate(selectedJob.created_at)}</p></div>
                      {selectedJob.assigned_employee_name && (
                        <div><p className="text-xs text-muted-foreground mb-0.5">Assigned To</p><p className="font-bold">{selectedJob.assigned_employee_name}</p></div>
                      )}
                      {selectedJob.approved_at && (
                        <div><p className="text-xs text-muted-foreground mb-0.5">Approved At</p><p className="font-bold text-green-700">{formatDate(selectedJob.approved_at)}</p></div>
                      )}
                      {selectedJob.rejected_at && (
                        <div><p className="text-xs text-muted-foreground mb-0.5">Rejected At</p><p className="font-bold text-red-700">{formatDate(selectedJob.rejected_at)}</p></div>
                      )}
                    </div>
                    {(selectedJob.sla_accept_breached || selectedJob.sla_completion_breached) && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>
                          {selectedJob.sla_accept_breached && "SLA acceptance time exceeded. "}
                          {selectedJob.sla_completion_breached && "SLA completion time exceeded."}
                        </span>
                      </div>
                    )}
                    {actionError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />{actionError}
                      </div>
                    )}
                    {isPending && (
                      <div className="flex gap-3 pt-2">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 gap-2 rounded-xl"
                          onClick={() => handleApprove(selectedJob.id)} disabled={!!actionLoading}>
                          {actionLoading === selectedJob.id + "_approve" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Approve
                        </Button>
                        <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2 rounded-xl"
                          onClick={() => handleReject(selectedJob.id)} disabled={!!actionLoading}>
                          {actionLoading === selectedJob.id + "_reject" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </HRLayout>
  )
}
