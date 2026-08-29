"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  ShieldCheck,
  FileText,
  Camera,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Signature,
  Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiClient } from "@/lib/apiClient"

interface JobCardDrawerProps {
  job: any
  isOpen: boolean
  onToggle: () => void
}

export function JobCardDrawer({ job, isOpen, onToggle }: JobCardDrawerProps) {
  const [proofs, setProofs] = React.useState<any[]>([])
  const [loadingProofs, setLoadingProofs] = React.useState(false)
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null)

  // Fetch proof of work records when drawer opens
  React.useEffect(() => {
    if (isOpen && job?.id) {
      setLoadingProofs(true)
      apiClient<any>(`/api/jobs/${job.id}/proof-of-work`)
        .then((res) => {
          if (res?.success && Array.isArray(res.proofs)) {
            setProofs(res.proofs)
          } else if (Array.isArray(res)) {
            setProofs(res)
          }
        })
        .catch(() => {})
        .finally(() => setLoadingProofs(false))
    }
  }, [isOpen, job?.id])

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
          {isOpen ? "Hide Job Breakdown & Site Proofs" : "View Activity Timeline, Site Proofs & Audit Logs"}
        </span>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </Button>

      {isOpen && (
        <div className="mt-2.5 p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-4 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
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

          {/* 📸 Field Proof-of-Work Section */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-emerald-500" /> Verified Site Proof-of-Work ({proofs.length})
              </span>
              {loadingProofs && <span className="text-[10px] text-muted-foreground animate-pulse">Loading proofs...</span>}
            </div>

            {proofs.length === 0 && !loadingProofs ? (
              <div className="p-3 rounded-lg border border-dashed border-border/60 bg-background/50 text-center text-[11px] text-muted-foreground">
                No site progress photos or sign-offs uploaded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {proofs.map((p, idx) => (
                  <div key={p.id || idx} className="p-3 rounded-xl bg-background border border-border/60 shadow-xs space-y-2.5">
                    {/* Header with uploader & stage */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{p.uploaded_by_name || "Field Technician"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.stage && (
                          <Badge variant="outline" className="text-[9px] capitalize font-mono">
                            {p.stage.replace("_", " ")}
                          </Badge>
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {p.created_at || p.signed_at
                            ? new Date(p.created_at || p.signed_at).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                    </div>

                    {/* Site Progress Photo */}
                    {p.photo_url && (
                      <div className="relative group rounded-lg overflow-hidden border border-border/50 max-h-48 bg-black/5">
                        <img
                          src={p.photo_url}
                          alt="Site Progress"
                          className="w-full h-40 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                          onClick={() => setSelectedPhoto(p.photo_url)}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(p.photo_url)}
                          className="absolute right-2 bottom-2 p-1.5 rounded-md bg-black/70 text-white text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Maximize2 className="h-3 w-3" /> View Full
                        </button>
                      </div>
                    )}

                    {/* Site Notes */}
                    {p.notes && (
                      <p className="text-[11px] text-foreground/90 bg-muted/30 p-2 rounded-lg leading-relaxed">
                        {p.notes}
                      </p>
                    )}

                    {/* GPS Coordinates */}
                    {(p.gps_latitude || p.gps_longitude) && (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="h-3 w-3 text-amber-500" />
                          GPS: {Number(p.gps_latitude).toFixed(4)}, {Number(p.gps_longitude).toFixed(4)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${p.gps_latitude},${p.gps_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-0.5 font-bold"
                        >
                          Open Maps <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}

                    {/* Customer E-Signature */}
                    {p.customer_signature_url && (
                      <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <Signature className="h-3 w-3" /> Customer Digital Sign-Off
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {p.signed_at ? new Date(p.signed_at).toLocaleDateString() : "Verified"}
                          </span>
                        </div>
                        <img
                          src={p.customer_signature_url}
                          alt="Customer Signature"
                          className="h-16 max-w-[200px] object-contain bg-white rounded border border-border/40 p-1"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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

      {/* Full Photo Modal */}
      <Dialog open={Boolean(selectedPhoto)} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl p-3 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Site Progress Photo Preview</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <img src={selectedPhoto} alt="Site Proof Full" className="w-full max-h-[80vh] object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
