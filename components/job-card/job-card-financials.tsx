"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, Download, Edit3, CheckCircle2, Clock } from "lucide-react"

interface JobCardFinancialsProps {
  invoice?: {
    id: string
    invoice_number: string
    version_number?: number
    edited_count?: number
    total_amount: number
    status: string
    viewed_at?: string
    downloaded_at?: string
  } | null
  budget?: number
  role?: "owner" | "employee"
}

export function JobCardFinancials({ invoice, budget = 0, role = "owner" }: JobCardFinancialsProps) {
  if (!invoice) {
    return (
      <div className="p-2.5 rounded-xl bg-muted/40 border border-dashed border-border/70 flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          Invoice: <span className="italic">Awaiting Finalization</span>
        </span>
        {budget > 0 && (
          <span className="font-mono font-bold text-foreground">Budget: ₹{budget.toLocaleString("en-IN")}</span>
        )}
      </div>
    )
  }

  const isViewed = !!invoice.viewed_at
  const isDownloaded = !!invoice.downloaded_at
  const editedCount = invoice.edited_count || 0
  const handleInvoiceClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (role === "owner" && invoice?.id) {
      window.location.href = `/owner/jobs/${invoice.id}/invoice-editor`
    }
  }

  return (
    <div 
      className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-2 text-xs cursor-pointer hover:border-primary/40 hover:bg-primary/10 transition-all"
      onClick={handleInvoiceClick}
      title="Click to view/edit invoice"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="font-mono font-extrabold text-foreground">{invoice.invoice_number}</span>
          <Badge variant="outline" className="text-[10px] font-mono font-bold bg-background text-foreground border-border/80 px-1.5 py-0">
            v1.{editedCount}
          </Badge>
          {editedCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              Edited {editedCount}x
            </span>
          )}
        </div>

        <div className="font-mono text-sm font-black text-foreground">
          ₹{Number(invoice.total_amount || 0).toLocaleString("en-IN")}
        </div>
      </div>

      {/* Customer Audit Strip */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-primary/10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {isViewed ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Eye className="h-3 w-3" /> Viewed
            </span>
          ) : (
            <span className="text-muted-foreground/70 italic flex items-center gap-1">
              <Clock className="h-3 w-3" /> Not viewed
            </span>
          )}

          {isDownloaded && (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
              <Download className="h-3 w-3" /> Downloaded
            </span>
          )}
        </div>

        <Badge
          className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
            invoice.status === "paid"
              ? "bg-emerald-600 text-white"
              : invoice.status === "disputed"
              ? "bg-amber-600 text-white animate-pulse"
              : "bg-indigo-600 text-white"
          }`}
        >
          {invoice.status.toUpperCase()}
        </Badge>
      </div>
    </div>
  )
}
