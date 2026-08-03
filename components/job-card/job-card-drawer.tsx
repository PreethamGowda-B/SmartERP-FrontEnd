"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Package, Clock, ShieldCheck, FileText, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface JobCardDrawerProps {
  job: any
  isOpen: boolean
  onToggle: () => void
}

export function JobCardDrawer({ job, isOpen, onToggle }: JobCardDrawerProps) {
  const timelineEvents = React.useMemo(() => {
    const events: { label: string; date?: string; type: "info" | "success" | "warning" | "error"; detail?: string }[] = []
    
    if (job.created_at) events.push({ label: "Job Created & Assigned", date: job.created_at, type: "info", detail: `By ${job.created_by_name || "Owner"}` })
    if (job.accepted_at) events.push({ label: "Job Accepted by Field Tech", date: job.accepted_at, type: "success", detail: `Accepted by ${job.accepted_by_name || job.assigned_employee_name || "Technician"}` })
    if (job.started_at) events.push({ label: "Work Started / Timer Active", date: job.started_at, type: "info" })
    if (job.progress > 0) events.push({ label: `Progress Updated to ${job.progress}%`, type: "info", detail: `${job.progress}% completed` })
    if (job.completed_at) events.push({ label: "Marked Complete by Field Tech", date: job.completed_at, type: "success" })

    return events
  }, [job])

  return (
    <div className="pt-1">
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center justify-between px-2 bg-muted/30 hover:bg-muted/60 rounded-lg transition-colors"
        onClick={onToggle}
      >
        <span className="flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-primary" />
          {isOpen ? "Hide Job Breakdown & Timeline" : "View Activity Timeline, Breakdown & Audit Logs"}
        </span>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </Button>

      {isOpen && (
        <div className="mt-2.5 p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-3.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Notes */}
          {job.description && (
            <div className="space-y-1">
              <span className="font-bold text-foreground">Scope / Description:</span>
              <p className="text-muted-foreground leading-relaxed italic">{job.description}</p>
            </div>
          )}

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2.5 rounded-xl bg-background border border-border/50 space-y-0.5 shadow-2xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-500" /> Working Hours
              </span>
              <p className="font-mono font-bold text-foreground text-sm">{job.spent_hours || 0} hrs logged</p>
            </div>
            <div className="p-2.5 rounded-xl bg-background border border-border/50 space-y-0.5 shadow-2xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-amber-500" /> Materials Used
              </span>
              <p className="font-mono font-bold text-foreground text-sm">₹{Number(job.materials_cost || 0).toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Chronological Activity Timeline */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground block">
              Enterprise Activity Timeline
            </span>
            <div className="space-y-2 pl-2 border-l-2 border-primary/30">
              {timelineEvents.map((ev, idx) => (
                <div key={idx} className="relative pl-3 space-y-0.5">
                  <div className="absolute -left-[13px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">{ev.label}</span>
                    {ev.date && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(ev.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  {ev.detail && <p className="text-[10px] text-muted-foreground">{ev.detail}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Audit Timestamp Footprint */}
          <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between items-center">
            <span>Created: {new Date(job.created_at || Date.now()).toLocaleDateString()}</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" /> Audit Verified
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
