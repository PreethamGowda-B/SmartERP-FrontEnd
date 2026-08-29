"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Zap, Edit, Trash2, CheckCircle2, UserCheck, ShieldAlert, Camera } from "lucide-react"

interface JobCardActionToolbarProps {
  job: any
  role?: "owner" | "employee"
  isAcceptedByCurrentUser?: boolean
  onView?: (job: any) => void
  onEdit?: (job: any) => void
  onDelete?: (job: any) => void
  onActionComplete?: () => void
  onOpenJobActions?: () => void
  onEmergencyOverride?: () => void
}

export function JobCardActionToolbar({
  job,
  role = "owner",
  isAcceptedByCurrentUser = false,
  onView,
  onEdit,
  onDelete,
  onActionComplete,
  onOpenJobActions,
  onEmergencyOverride,
}: JobCardActionToolbarProps) {
  const status = (job.status || "open").toLowerCase()

  const handleOpenJobActions = (e: React.MouseEvent) => {
    e.stopPropagation()
    React.startTransition(() => {
      if (onOpenJobActions) {
        onOpenJobActions()
      } else {
        const evt = new CustomEvent("openJobActions", {
          detail: { jobId: job.id, jobTitle: job.title },
        })
        window.dispatchEvent(evt)
      }
    })
  }

  const handleOpenInvoiceEditor = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `/owner/jobs/${job.id}/invoice-editor`
  }

  return (
      {/* ── ROLE: OWNER MANAGEMENT CONSOLE ACTIONS ── */}
      {role === "owner" && (
        <div className="w-full flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs font-bold px-3 active:scale-95 transition-transform rounded-xl hover:bg-primary hover:text-primary-foreground border-border/80 shadow-xs flex items-center justify-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation()
              if (onView) onView(job)
              else window.location.href = `/owner/jobs/${job.id}`
            }}
          >
            <Eye className="h-3.5 w-3.5" />
            View Details &amp; Operations
          </Button>
        </div>
      )}

      {/* ── ROLE: EMPLOYEE FIELD WORKSPACE ACTIONS (ONLY ACCEPTED TECHNICIAN) ── */}
      {role === "employee" && (
        <>
          {status !== "completed" && status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-emerald-300 text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 font-bold dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 active:scale-95 transition-transform rounded-xl shadow-xs"
              onClick={(e) => {
                e.stopPropagation()
                const evt = new CustomEvent("openProofOfWorkModal", { detail: { jobId: job.id } })
                window.dispatchEvent(evt)
              }}
            >
              <Camera className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              Submit Site Proof & Sign-Off
            </Button>
          )}

          {isAcceptedByCurrentUser && status !== "completed" && status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-bold dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 active:scale-95 transition-transform rounded-xl"
              onClick={handleOpenJobActions}
            >
              <Zap className="h-3.5 w-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
              Job Actions
            </Button>
          )}

          {status === "completed" && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Work Completed & Verified
            </span>
          )}
        </>
      )}
    </div>
  )
}
