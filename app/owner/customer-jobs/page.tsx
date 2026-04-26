"use client"

import { useState, useCallback, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { apiClient } from "@/lib/apiClient"
import {
  Search, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle,
  User, Building2, Calendar, ChevronRight, Filter, UserCheck,
  Zap, Settings2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface Settings {
  auto_approve_customer_jobs: boolean
  hourly_rate: number
  service_charge: number
  sla?: { max_accept_time: number; max_completion_time: number }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OwnerCustomerJobsPage() {
  const [jobs, setJobs] = useState<CustomerJob[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [approvalFilter, setApprovalFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedJob, setSelectedJob] = useState<CustomerJob | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>({ auto_approve_customer_jobs: false, hourly_rate: 50, service_charge: 0 })
  const [settingsSaving, setSettingsSaving] = useState(false)

  // ── Fetch jobs ──────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      if (approvalFilter !== "all") params.set("approval_status", approvalFilter)
      if (priorityFilter !== "all") params.set("priority", priorityFilter)
      const data = await apiClient(`/api/v1/customer-jobs?${params}`)
      if (data?.success) {
        setJobs(data.data.jobs || [])
        setTotal(data.data.total || 0)
      }
    } catch (err) {
      console.error("Failed to fetch customer jobs:", err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [approvalFilter, priorityFilter])

  // ── Fetch settings ──────────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiClient("/api/v1/customer-jobs/settings")
      if (data?.success) setSettings(data.data)
    } catch {}
  }, [])

  useEffect(() => { fetchJobs(); fetchSettings() }, [fetchJobs, fetchSettings])

  // ── Approve ─────────────────────────────────────────────────────────────────
  const handleApprove = async (jobId: string) => {
    setActionLoading(jobId + "_approve")
    setActionError("")
    try {
      const data = await apiClient(`/api/v1/customer-jobs/${jobId}/approve`, { method: "POST" })
      if (data?.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, approval_status: "approved", approved_at: new Date().toISOString() } : j))
        if (selectedJob?.id === jobId) setSelectedJob(prev => prev ? { ...prev, approval_status: "approved" } : prev)
      } else {
        setActionError(data?.error || "Failed to approve")
      }
    } catch (err: any) {
      setActionError(err?.error || err?.message || "Failed to approve")
    } finally {
      setActionLoading(null)
    }
  }

  // ── Reject ──────────────────────────────────────────────────────────────────
  const handleReject = async (jobId: string) => {
    setActionLoading(jobId + "_reject")
    setActionError("")
    try {
      const data = await apiClient(`/api/v1/customer-jobs/${jobId}/reject`, { method: "POST", body: JSON.stringify({}) })
      if (data?.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, approval_status: "rejected", rejected_at: new Date().toISOString() } : j))
        if (selectedJob?.id === jobId) setSelectedJob(prev => prev ? { ...prev, approval_status: "rejected" } : prev)
      } else {
        setActionError(data?.error || "Failed to reject")
      }
    } catch (err: any) {
      setActionError(err?.error || err?.message || "Failed to reject")
    } finally {
      setActionLoading(null)
    }
  }

  // ── Save settings ───────────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    try {
      await apiClient("/api/v1/customer-jobs/settings", {
        method: "PUT",
        body: JSON.stringify({
          auto_approve_customer_jobs: settings.auto_approve_customer_jobs,
          hourly_rate: settings.hourly_rate,
          service_charge: settings.service_charge,
          sla_max_accept_time: settings.sla?.max_accept_time,
          sla_max_completion_time: settings.sla?.max_completion_time,
        }),
      })
      setSettingsOpen(false)
    } catch {}
    setSettingsSaving(false)
  }

  // ── Filtered jobs ───────────────────────────────────────────────────────────
  const filtered = jobs.filter(j => {
    const q = searchTerm.toLowerCase()
    return !q || j.title?.toLowerCase().includes(q) || j.customer_name?.toLowerCase().includes(q) || j.customer_company_name?.toLowerCase().includes(q)
  })

  // ── Stats ───────────────────────────────────────────────────────────────────
  const pending  = jobs.filter(j => j.approval_status === "pending_approval").length
  const approved = jobs.filter(j => j.approval_status === "approved").length
  const rejected = jobs.filter(j => j.approval_status === "rejected").length

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Customer Jobs</h1>
            </div>
            <p className="text-muted-foreground text-sm">Review and approve service requests submitted by customers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="gap-2">
              <Settings2 className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchJobs(true)} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-700">{pending}</div>
                <div className="text-xs text-amber-600 font-medium">Pending Review</div>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-700">{approved}</div>
                <div className="text-xs text-green-600 font-medium">Approved</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-700">{rejected}</div>
                <div className="text-xs text-red-600 font-medium">Not Approved</div>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by job title, customer, or company..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={approvalFilter} onValueChange={v => { setApprovalFilter(v); }}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Approval Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Not Approved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); }}>
            <SelectTrigger className="w-full sm:w-36">
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

        {/* Job list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <UserCheck className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No customer jobs found</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Customer-submitted jobs will appear here for review</p>
            </CardContent>
          </Card>
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
                    "bg-card border rounded-xl p-5 hover:shadow-sm transition-all cursor-pointer",
                    isPending && "border-amber-200 bg-amber-50/20",
                    job.approval_status === "approved" && "border-green-100",
                    job.approval_status === "rejected" && "border-red-100 opacity-80",
                  )}
                  onClick={() => { setSelectedJob(job); setActionError("") }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${priority.className}`}>{priority.label}</span>
                        {job.ai_suggested_priority && job.ai_suggested_priority !== job.priority && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Zap className="h-3 w-3" />AI: {job.ai_suggested_priority}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {job.customer_name && (
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{job.customer_name}</span>
                        )}
                        {job.customer_company_name && (
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.customer_company_name}</span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(job.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${approval.className}`}>
                        <ApprovalIcon className="h-3 w-3" />
                        {approval.label}
                      </span>
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 bg-green-600 hover:bg-green-700 text-white gap-1"
                            onClick={e => { e.stopPropagation(); handleApprove(job.id) }}
                            disabled={actionLoading === job.id + "_approve"}
                          >
                            {actionLoading === job.id + "_approve" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50 gap-1"
                            onClick={e => { e.stopPropagation(); handleReject(job.id) }}
                            disabled={actionLoading === job.id + "_reject"}
                          >
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

        {/* Job detail dialog */}
        <Dialog open={!!selectedJob} onOpenChange={open => !open && setSelectedJob(null)}>
          <DialogContent className="max-w-lg">
            {selectedJob && (() => {
              const approval = APPROVAL_CONFIG[selectedJob.approval_status] || APPROVAL_CONFIG.pending_approval
              const ApprovalIcon = approval.icon
              const priority = PRIORITY_CONFIG[selectedJob.priority] || PRIORITY_CONFIG.medium
              const isPending = selectedJob.approval_status === "pending_approval"
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-lg">{selectedJob.title}</DialogTitle>
                    <DialogDescription>Customer job request details</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${approval.className}`}>
                        <ApprovalIcon className="h-3 w-3" />{approval.label}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${priority.className}`}>{priority.label}</span>
                    </div>

                    {/* Description */}
                    {selectedJob.description && (
                      <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{selectedJob.description}</p>
                    )}

                    {/* Customer info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Customer</p>
                        <p className="font-medium">{selectedJob.customer_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Company</p>
                        <p className="font-medium">{selectedJob.customer_company_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Submitted</p>
                        <p className="font-medium">{formatDate(selectedJob.created_at)}</p>
                      </div>
                      {selectedJob.assigned_employee_name && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Assigned To</p>
                          <p className="font-medium">{selectedJob.assigned_employee_name}</p>
                        </div>
                      )}
                      {selectedJob.approved_at && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Approved At</p>
                          <p className="font-medium text-green-700">{formatDate(selectedJob.approved_at)}</p>
                        </div>
                      )}
                      {selectedJob.rejected_at && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Rejected At</p>
                          <p className="font-medium text-red-700">{formatDate(selectedJob.rejected_at)}</p>
                        </div>
                      )}
                    </div>

                    {/* SLA warnings */}
                    {(selectedJob.sla_accept_breached || selectedJob.sla_completion_breached) && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>
                          {selectedJob.sla_accept_breached && "SLA acceptance time exceeded. "}
                          {selectedJob.sla_completion_breached && "SLA completion time exceeded."}
                        </span>
                      </div>
                    )}

                    {/* Error */}
                    {actionError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {actionError}
                      </div>
                    )}

                    {/* Actions */}
                    {isPending && (
                      <div className="flex gap-3 pt-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                          onClick={() => handleApprove(selectedJob.id)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === selectedJob.id + "_approve" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Approve Request
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2"
                          onClick={() => handleReject(selectedJob.id)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === selectedJob.id + "_reject" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject Request
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* Settings dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Customer Job Settings</DialogTitle>
              <DialogDescription>Configure how customer job requests are handled</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              {/* Auto-approve toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Auto-Approve Jobs</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatically approve all customer submissions</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, auto_approve_customer_jobs: !s.auto_approve_customer_jobs }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.auto_approve_customer_jobs ? "bg-green-500" : "bg-gray-300"
                  )}
                >
                  <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow", settings.auto_approve_customer_jobs ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>

              {/* SLA */}
              <div className="space-y-3">
                <p className="text-sm font-medium">SLA Targets</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Accept within (min)</label>
                    <Input
                      type="number"
                      value={settings.sla?.max_accept_time ?? 30}
                      onChange={e => setSettings(s => ({ ...s, sla: { ...s.sla!, max_accept_time: parseInt(e.target.value) || 30 } }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Complete within (min)</label>
                    <Input
                      type="number"
                      value={settings.sla?.max_completion_time ?? 240}
                      onChange={e => setSettings(s => ({ ...s, sla: { ...s.sla!, max_completion_time: parseInt(e.target.value) || 240 } }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handleSaveSettings} disabled={settingsSaving}>
                {settingsSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
