"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  User,
  Package,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Signature,
  DollarSign,
  Maximize2,
  ShieldCheck,
  Edit,
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"

interface JobDetailsModalProps {
  job: any | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (job: any) => void
}

export function JobDetailsModal({ job, isOpen, onClose, onEdit }: JobDetailsModalProps) {
  const [proofs, setProofs] = React.useState<any[]>([])
  const [loadingProofs, setLoadingProofs] = React.useState(false)
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null)

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

  if (!job) return null

  const status = String(job.status || "open").toLowerCase()
  const priority = String(job.priority || "normal").toLowerCase()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-5">
        <DialogHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs uppercase">
                  #{String(job.id).substring(0, 8)}
                </Badge>
                <Badge
                  className={
                    status === "completed"
                      ? "bg-emerald-500 text-white"
                      : status === "in_progress"
                      ? "bg-blue-500 text-white"
                      : "bg-amber-500 text-white"
                  }
                >
                  {status.toUpperCase().replace("_", " ")}
                </Badge>
                {priority === "high" || priority === "urgent" ? (
                  <Badge variant="destructive" className="uppercase text-[10px]">
                    {priority}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    {priority}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground">{job.title || "Untitled Job"}</DialogTitle>
              <DialogDescription className="text-xs flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>Client: <strong>{job.client || job.customer_name || "Enterprise Client"}</strong></span>
                {job.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                  </>
                )}
              </DialogDescription>
            </div>

            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onEdit(job)
                }}
                className="h-8 text-xs font-semibold rounded-xl self-start sm:self-center gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Job
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Description & Scope */}
        {job.description && (
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[11px] uppercase font-bold text-muted-foreground block">Scope of Work</span>
            <p className="text-xs text-foreground leading-relaxed">{job.description}</p>
          </div>
        )}

        {/* Quick Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-background border border-border/60 shadow-xs space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" /> Logged Hours
            </span>
            <p className="text-base font-extrabold font-mono text-foreground">{job.spent_hours || 0} / {job.estimated_hours || 8}h</p>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/60 shadow-xs space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-emerald-500" /> Budget
            </span>
            <p className="text-base font-extrabold font-mono text-foreground">₹{Number(job.budget || job.estimated_cost || 0).toLocaleString("en-IN")}</p>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/60 shadow-xs space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3 text-amber-500" /> Start Date
            </span>
            <p className="text-xs font-bold text-foreground">
              {job.startDate || job.created_at ? new Date(job.startDate || job.created_at).toLocaleDateString() : "—"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/60 shadow-xs space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3 text-purple-500" /> Technician
            </span>
            <p className="text-xs font-bold text-foreground truncate">{job.accepted_by_name || job.assigned_employee_name || "Unassigned"}</p>
          </div>
        </div>

        {/* 📸 Verified Site Proof-of-Work Section */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Camera className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Field Proof-of-Work Submissions ({proofs.length})</h3>
            </div>
            {loadingProofs && <span className="text-[10px] text-muted-foreground animate-pulse">Syncing proofs...</span>}
          </div>

          {proofs.length === 0 && !loadingProofs ? (
            <div className="p-6 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center space-y-1">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground/30" />
              <p className="text-xs font-semibold text-foreground">No Site Proofs Uploaded Yet</p>
              <p className="text-[11px] text-muted-foreground">
                When the on-site technician uploads progress photos, notes, GPS check-ins, or customer sign-offs, they will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {proofs.map((p, idx) => (
                <div key={p.id || idx} className="p-3.5 rounded-xl bg-background border border-border/70 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{p.uploaded_by_name || "Technician"}</span>
                    </div>
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

                  {/* Site Progress Photo */}
                  {p.photo_url && (
                    <div className="relative group rounded-lg overflow-hidden border border-border/50 bg-black/5">
                      <img
                        src={p.photo_url}
                        alt="Site Proof"
                        className="w-full h-44 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => setSelectedPhoto(p.photo_url)}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(p.photo_url)}
                        className="absolute right-2 bottom-2 p-1.5 rounded-md bg-black/70 text-white text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Maximize2 className="h-3 w-3" /> Full View
                      </button>
                    </div>
                  )}

                  {/* Notes */}
                  {p.notes && (
                    <p className="text-xs text-foreground bg-muted/40 p-2 rounded-lg leading-relaxed">{p.notes}</p>
                  )}

                  {/* GPS Coordinates */}
                  {(p.gps_latitude || p.gps_longitude) && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
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

                  {/* Customer Signature */}
                  {p.customer_signature_url && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <Signature className="h-3.5 w-3.5" /> Customer Digital Sign-Off
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          VERIFIED
                        </Badge>
                      </div>
                      <img
                        src={p.customer_signature_url}
                        alt="Customer Signature"
                        className="h-16 max-w-[220px] object-contain bg-white rounded border border-border/50 p-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border/50">
          <Button onClick={onClose} className="rounded-xl text-xs font-bold px-4">
            Close
          </Button>
        </DialogFooter>

        {/* Full Image Lightbox */}
        <Dialog open={Boolean(selectedPhoto)} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl p-3 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xs font-bold">Site Progress Inspection Photo</DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <img src={selectedPhoto} alt="Site Proof Full" className="w-full max-h-[80vh] object-contain rounded-xl" />
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
