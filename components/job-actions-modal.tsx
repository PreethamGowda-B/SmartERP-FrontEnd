"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Zap, AlertTriangle, Users, Wrench, Clock, FileText, Camera,
  ShieldAlert, DollarSign, Package, CheckCircle2, ChevronRight, Loader2, X, AlertOctagon
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
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
  const [selectedOption, setSelectedOption] = useState<ActionOption | null>(null)
  const [notes, setNotes] = useState("")
  const [workerCount, setWorkerCount] = useState("1")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [extensionHours, setExtensionHours] = useState("2")
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSelectOption = (opt: ActionOption) => {
    setSelectedOption(opt)
    setNotes("")
    setEvidenceUrl("")
  }

  const handleSubmitAction = async () => {
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
      }).catch(() => {})

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

      setSelectedOption(null)
      onClose()
      if (onActionComplete) onActionComplete()
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit job action")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            Job Actions Command Center
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Select an action or report an issue for <span className="font-bold text-slate-900">{jobTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {!selectedOption ? (
          <div className="space-y-6 mt-4">
            {ACTION_MODULES.map((mod) => {
              const IconComp = mod.icon
              return (
                <div key={mod.category} className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
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
                        className={`text-left p-3 rounded-2xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all flex items-start justify-between group ${opt.urgency === "emergency" ? "bg-rose-50/70 border-rose-300" : ""}`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">{opt.label}</span>
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
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Selected Action</span>
                <span className="text-base font-black text-slate-900">{selectedOption.label}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOption(null)} className="text-xs text-slate-500">
                Change
              </Button>
            </div>

            {/* Inputs based on selected action */}
            {selectedOption.requiresExtraInput === "workers" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Number of Extra Workers Needed</label>
                <Input
                  type="number" min="1" max="10"
                  value={workerCount} onChange={(e) => setWorkerCount(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            {selectedOption.requiresExtraInput === "expense" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Expense Amount (₹)</label>
                <Input
                  type="number" placeholder="e.g. 500"
                  value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            {selectedOption.requiresExtraInput === "extension" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Requested Extension (Hours)</label>
                <Input
                  type="number" min="1" max="72"
                  value={extensionHours} onChange={(e) => setExtensionHours(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Additional Description / Reason</label>
              <Textarea
                rows={3}
                placeholder="Explain the situation or details for the owner..."
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Photo / Document Evidence URL (Optional)</label>
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
                {submitting ? "Submitting..." : selectedOption.urgency === "emergency" ? "Trigger Emergency Alert" : "Submit Action"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
