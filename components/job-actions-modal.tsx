"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Zap, Users, Clock, FileText, Camera,
  ShieldAlert, Package, CheckCircle2, ChevronRight, Loader2, RefreshCw, XCircle, UserCheck, MessageSquare
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { useNotifications } from "@/contexts/notification-context"
import { useClockInGatekeeper } from "@/contexts/clock-in-gatekeeper-context"
import { toast } from "sonner"

interface JobActionsModalProps {
  jobId: string
  jobTitle: string
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
}

type ActionCategory = "status" | "assistance" | "material" | "evidence" | "safety"

interface ActionOption {
  id: string
  label: string
  description: string
  category: ActionCategory
  urgency: "normal" | "high" | "emergency"
  requiresExtraInput?: "workers" | "notes" | "evidence" | "expense" | "extension"
}

const ACTION_MODULES: { category: ActionCategory; title: string; icon: any; color: string; options: ActionOption[] }[] = [
  {
    category: "status",
    title: "1. Work Status Controls",
    icon: Zap,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    options: [
      { id: "start_job", label: "Start Work / Arrived on Site", description: "Mark your arrival and start job timer", category: "status", urgency: "normal" },
      { id: "pause_work", label: "Pause Work (Put On Hold)", description: "Temporarily pause work due to site conditions", category: "status", urgency: "normal", requiresExtraInput: "notes" },
      { id: "resume_work", label: "Resume Work", description: "Resume work after hold", category: "status", urgency: "normal" },
      { id: "mark_complete", label: "Mark Job Complete", description: "Submit job for final owner & client sign-off", category: "status", urgency: "normal", requiresExtraInput: "evidence" }
    ]
  },
  {
    category: "assistance",
    title: "2. Assistance & Escalations",
    icon: Users,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    options: [
      { id: "need_more_workers", label: "Need Extra Workers", description: "Request additional staff dispatched to site", category: "assistance", urgency: "high", requiresExtraInput: "workers" },
      { id: "site_blocker", label: "Site Blocker / Obstacle", description: "Report site issue preventing work progress", category: "assistance", urgency: "high", requiresExtraInput: "evidence" },
      { id: "machine_breakdown", label: "Machine / Tool Breakdown", description: "Report faulty equipment requiring repair/replacement", category: "assistance", urgency: "high", requiresExtraInput: "notes" },
      { id: "customer_unavailable", label: "Customer Unavailable", description: "Client not at location / site locked", category: "assistance", urgency: "normal", requiresExtraInput: "notes" },
      { id: "tech_assistance", label: "Technical Assistance", description: "Request guidance from supervisor / engineer", category: "assistance", urgency: "normal", requiresExtraInput: "notes" },
      { id: "deadline_extension", label: "Request Deadline Extension", description: "Ask for extra time to complete job", category: "assistance", urgency: "normal", requiresExtraInput: "extension" }
    ]
  },
  {
    category: "material",
    title: "3. Materials & Expenses",
    icon: Package,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    options: [
      { id: "request_materials", label: "Request Extra Site Materials", description: "Request inventory parts delivered to site", category: "material", urgency: "normal", requiresExtraInput: "notes" },
      { id: "log_expense", label: "Log Out-of-Pocket Expense", description: "Request reimbursement for field expense", category: "material", urgency: "normal", requiresExtraInput: "expense" }
    ]
  },
  {
    category: "evidence",
    title: "4. Documentation & Evidence",
    icon: Camera,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    options: [
      { id: "upload_photos", label: "Upload Before / Progress Photos", description: "Attach photo evidence of site work", category: "evidence", urgency: "normal", requiresExtraInput: "evidence" },
      { id: "upload_report", label: "Attach Inspection / Work Report", description: "Upload field report document", category: "evidence", urgency: "normal", requiresExtraInput: "evidence" }
    ]
  },
  {
    category: "safety",
    title: "5. Safety & Emergency Alerts",
    icon: ShieldAlert,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    options: [
      { id: "report_hazard", label: "Report Site Safety Hazard", description: "Report unsafe conditions to safety officer", category: "safety", urgency: "high", requiresExtraInput: "notes" },
      { id: "emergency_sos", label: "🚨 TRIGGER SOS EMERGENCY ALERT", description: "Immediate emergency alert dispatched to all owners", category: "safety", urgency: "emergency", requiresExtraInput: "notes" }
    ]
  }
]

export function JobActionsModal({ jobId, jobTitle, isOpen, onClose, onActionComplete }: JobActionsModalProps) {
  const { registerMessagingHandler, unregisterMessagingHandler } = useNotifications()
  const { withClockInCheck } = useClockInGatekeeper()

  const [activeTab, setActiveTab] = useState<"actions" | "my_requests">("actions")
  const [selectedOption, setSelectedOption] = useState<ActionOption | null>(null)
  const [notes, setNotes] = useState("")
  const [workerCount, setWorkerCount] = useState("1")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [extensionHours, setExtensionHours] = useState("2")
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Job Requests Tracking State
  const [jobRequests, setJobRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const fetchJobRequests = useCallback(async () => {
    if (!jobId || !isOpen) return
    try {
      setLoadingRequests(true)
      const res = await apiClient(`/api/work-requests?job_id=${jobId}`)
      const list = Array.isArray(res.requests) ? res.requests : Array.isArray(res) ? res : []
      setJobRequests(list)
    } catch (err) {
      console.warn("⚠️ Error fetching job-specific work requests:", err)
    } finally {
      setLoadingRequests(false)
    }
  }, [jobId, isOpen])

  // Real-time updates via SSE listener
  useEffect(() => {
    if (!isOpen) return
    fetchJobRequests()

    const handleSSEMessage = (msg: any) => {
      if (msg.type === "notification" || msg.type === "work_request_response") {
        fetchJobRequests()
      }
    }

    registerMessagingHandler(handleSSEMessage)
    return () => {
      unregisterMessagingHandler()
    }
  }, [isOpen, fetchJobRequests, registerMessagingHandler, unregisterMessagingHandler])

  const handleClose = () => {
    React.startTransition(() => {
      setSelectedOption(null)
      setActiveTab("actions")
      onClose()
    })
  }

  const handleSelectOption = (opt: ActionOption) => {
    React.startTransition(() => {
      setSelectedOption(opt)
      setNotes("")
      setEvidenceUrl("")
    })
  }

  const doSubmitAction = async () => {
    if (!selectedOption) return
    setSubmitting(true)

    const payload: Record<string, any> = {}
    if (selectedOption.requiresExtraInput === "workers") payload.worker_count = parseInt(workerCount) || 1
    if (selectedOption.requiresExtraInput === "expense") payload.expense_amount = parseFloat(expenseAmount) || 0
    if (selectedOption.requiresExtraInput === "extension") payload.requested_extension_hours = parseInt(extensionHours) || 2

    try {
      // 1. Post to Canonical Approval Engine (/api/work-requests)
      await apiClient(`/api/work-requests`, {
        method: "POST",
        body: JSON.stringify({
          request_type: selectedOption.id,
          category: selectedOption.category === "material" ? "inventory" : selectedOption.category === "safety" ? "safety" : "jobs",
          urgency: selectedOption.urgency,
          job_id: jobId,
          title: `${selectedOption.label} - ${jobTitle}`,
          reason: notes,
          evidence_urls: evidenceUrl ? [evidenceUrl] : [],
          payload,
        }),
      })

      // 2. Also log to legacy job actions table for backward compatibility
      await apiClient(`/api/jobs/${jobId}/actions`, {
        method: "POST",
        body: JSON.stringify({
          module: selectedOption.category,
          action_type: selectedOption.id,
          urgency: selectedOption.urgency,
          notes,
          evidence_urls: evidenceUrl ? [evidenceUrl] : [],
          payload
        })
      }).catch(() => {})

      toast.success(
        selectedOption.urgency === "emergency"
          ? "🚨 Emergency Alert Sent to Owner!"
          : `${selectedOption.label} submitted successfully`
      )

      // Refresh job requests list and switch to My Requests tab
      await fetchJobRequests()

      React.startTransition(() => {
        setSelectedOption(null)
        setActiveTab("my_requests")
        if (onActionComplete) onActionComplete()
      })
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit job action")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitAction = async () => {
    withClockInCheck(() => doSubmitAction())
  }

  const getStatusBadge = (st: string) => {
    const s = (st || "pending").toLowerCase()
    switch (s) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-bold">🟢 Approved</Badge>
      case "rejected":
      case "declined":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 font-bold">🔴 Rejected</Badge>
      case "in_review":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 font-bold">🔵 In Review</Badge>
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-bold">🟡 Pending Owner Review</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-600" />
                Job Actions Command Center
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium mt-0.5">
                Manage status, request escalation, & track approvals for <span className="font-bold text-slate-900 dark:text-slate-200">{jobTitle}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-3 my-2">
          <Button
            type="button"
            variant={activeTab === "actions" ? "default" : "ghost"}
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5"
            onClick={() => {
              setActiveTab("actions")
              setSelectedOption(null)
            }}
          >
            <Zap className="h-3.5 w-3.5" /> Actions & New Request
          </Button>

          <Button
            type="button"
            variant={activeTab === "my_requests" ? "default" : "ghost"}
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5"
            onClick={() => {
              setActiveTab("my_requests")
              fetchJobRequests()
            }}
          >
            <Clock className="h-3.5 w-3.5" /> My Requests
            {jobRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-primary/20 text-primary">
                {jobRequests.length}
              </span>
            )}
          </Button>
        </div>

        {/* Tab Content 1: Actions & New Request */}
        {activeTab === "actions" && (
          !selectedOption ? (
            <div className="space-y-6 mt-2">
              {ACTION_MODULES.map((mod) => {
                const IconComp = mod.icon
                return (
                  <div key={mod.category} className="space-y-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-700 dark:text-slate-300">
                      <div className={`p-1.5 rounded-lg border ${mod.color}`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      {mod.title}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {mod.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(opt)}
                          className={`text-left p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all flex items-start justify-between group ${opt.urgency === "emergency" ? "bg-rose-50/70 border-rose-300 dark:bg-rose-950/30" : ""}`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">{opt.label}</span>
                              {opt.urgency === "emergency" && (
                                <Badge variant="destructive" className="text-[9px] px-1 py-0 uppercase">SOS</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{opt.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-5 mt-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Selected Action</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{selectedOption.label}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOption(null)} className="text-xs text-slate-500">
                  Change
                </Button>
              </div>

              {/* Inputs based on selected action */}
              {selectedOption.requiresExtraInput === "workers" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Number of Extra Workers Needed</label>
                  <Input
                    type="number" min="1" max="10"
                    value={workerCount} onChange={(e) => setWorkerCount(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}

              {selectedOption.requiresExtraInput === "expense" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expense Amount (₹)</label>
                  <Input
                    type="number" placeholder="e.g. 500"
                    value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}

              {selectedOption.requiresExtraInput === "extension" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Requested Extension (Hours)</label>
                  <Input
                    type="number" min="1" max="72"
                    value={extensionHours} onChange={(e) => setExtensionHours(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Additional Description / Reason</label>
                <Textarea
                  rows={3}
                  placeholder="Explain the situation or details for the owner..."
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Photo / Document Evidence URL (Optional)</label>
                <Input
                  placeholder="https://res.cloudinary.com/..."
                  value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setSelectedOption(null)} className="flex-1 rounded-xl">
                  Back
                </Button>
                <Button
                  onClick={handleSubmitAction}
                  disabled={submitting}
                  className={`flex-1 rounded-xl text-white font-bold ${selectedOption.urgency === "emergency" ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {submitting ? "Submitting Request..." : selectedOption.urgency === "emergency" ? "Trigger Emergency Alert" : "Submit Request"}
                </Button>
              </div>
            </div>
          )
        )}

        {/* Tab Content 2: My Requests (Job-Scoped History & Live Tracking) */}
        {activeTab === "my_requests" && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Live Request Audit History for Job #{jobId.substring(0, 8)}
              </span>
              <Button variant="ghost" size="sm" onClick={fetchJobRequests} disabled={loadingRequests} className="h-7 text-xs gap-1">
                <RefreshCw className={`h-3 w-3 ${loadingRequests ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>

            {loadingRequests ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs">Fetching job request history...</span>
              </div>
            ) : jobRequests.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl p-6 bg-muted/20">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-2" />
                <h4 className="text-sm font-bold text-foreground">No Requests Logged Yet</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Submitted requests for this job (workers, materials, pause, safety) will appear here with live approval status.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/30 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-foreground">{req.title || req.request_type?.replace(/_/g, " ")}</span>
                          {getStatusBadge(req.status)}
                        </div>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Requested: {new Date(req.created_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {req.urgency || "normal"}
                      </Badge>
                    </div>

                    {req.reason && (
                      <p className="text-xs text-foreground/90 bg-muted/40 p-2.5 rounded-xl border border-border/50">
                        {req.reason}
                      </p>
                    )}

                    {/* Owner Decision Section */}
                    {(req.owner_response || req.response_notes || req.status === "approved" || req.status === "rejected") && (
                      <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        req.status === "approved" ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30" :
                        req.status === "rejected" ? "bg-rose-50/70 border-rose-200 dark:bg-rose-950/30" :
                        "bg-blue-50/70 border-blue-200 dark:bg-blue-950/30"
                      }`}>
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" /> Owner Response / Decision:
                          </span>
                        </div>
                        <p className="text-xs font-medium text-foreground italic">
                          "{req.owner_response || req.response_notes || (req.status === "approved" ? "Approved by Management" : "Rejected by Management")}"
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                          <span className="flex items-center gap-1 font-semibold">
                            <UserCheck className="h-3 w-3 text-emerald-600" />
                            {req.status === "approved" ? "Approved By: " : req.status === "rejected" ? "Rejected By: " : "Actioned By: "}
                            <strong className="text-foreground">{req.actioned_by_name || req.resolved_by_name || "Owner"}</strong>
                          </span>
                          <span>
                            {new Date(req.actioned_at || req.resolved_at || req.updated_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
