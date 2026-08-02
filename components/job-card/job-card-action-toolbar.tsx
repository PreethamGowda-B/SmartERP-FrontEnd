"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Zap, Edit, Trash2, CheckCircle2, MessageSquare, Mail, Play, Pause, AlertCircle } from "lucide-react"

interface JobCardActionToolbarProps {
  job: any
  role?: "owner" | "employee"
  onView?: (job: any) => void
  onEdit?: (job: any) => void
  onDelete?: (job: any) => void
  onActionComplete?: () => void
  onOpenJobActions?: () => void
}

export function JobCardActionToolbar({
  job,
  role = "owner",
  onView,
  onEdit,
  onDelete,
  onActionComplete,
  onOpenJobActions,
}: JobCardActionToolbarProps) {
  const status = (job.status || "open").toLowerCase()

  const handleOpenJobActions = () => {
    if (onOpenJobActions) {
      onOpenJobActions()
    } else {
      const evt = new CustomEvent("openJobActions", {
        detail: { jobId: job.id, jobTitle: job.title },
      })
      window.dispatchEvent(evt)
    }
  }

  const handleOpenInvoiceEditor = () => {
    window.location.href = `/owner/jobs/${job.id}/invoice-editor`
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/40">
      {onView && (
        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-2.5" onClick={() => onView(job)}>
          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
          View
        </Button>
      )}

      {/* Role: OWNER Actions */}
      {role === "owner" && (
        <>
          {status !== "completed" && status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-bold dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
              onClick={handleOpenJobActions}
            >
              <Zap className="h-3.5 w-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
              Work Requests
            </Button>
          )}

          {status === "completed" && (
            <Button
              size="sm"
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 shadow-xs"
              onClick={handleOpenInvoiceEditor}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Generate Invoice
            </Button>
          )}

          {onEdit && status !== "completed" && (
            <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" onClick={() => onEdit(job)}>
              <Edit className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Edit
            </Button>
          )}

          {onDelete && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10 px-2.5" onClick={() => onDelete(job)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </>
      )}

      {/* Role: EMPLOYEE Actions */}
      {role === "employee" && (
        <>
          {status !== "completed" && status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-bold dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
              onClick={handleOpenJobActions}
            >
              <Zap className="h-3.5 w-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
              Job Actions
            </Button>
          )}

          {status === "completed" && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Work Completed & Verified
            </span>
          )}
        </>
      )}
    </div>
  )
}
