"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  User,
  DollarSign,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Signature,
  FileText,
  Edit,
  ArrowLeft,
  RefreshCw,
  Maximize2,
  ShieldCheck,
  Package,
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { ErrorView } from "@/components/ui/error-view"
import { cn } from "@/lib/utils"

export default function OwnerJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.id as string

  const [job, setJob] = React.useState<any | null>(null)
  const [proofs, setProofs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null)

  const fetchJobData = React.useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      // Fetch job details
      const jobRes = await apiClient<any>(`/api/jobs/${jobId}`).catch(async () => {
        // Fallback: search in all jobs
        const allJobs = await apiClient<any>("/api/jobs")
        const list = Array.isArray(allJobs) ? allJobs : allJobs?.jobs || []
        const found = list.find((j: any) => String(j.id) === String(jobId))
        if (found) return found
        throw new Error("Job not found.")
      })
      setJob(jobRes?.job || jobRes)

      // Fetch proof-of-work gallery
      const proofRes = await apiClient<any>(`/api/jobs/${jobId}/proof-of-work`).catch(() => ({ proofs: [] }))
      setProofs(proofRes?.proofs || (Array.isArray(proofRes) ? proofRes : []))
    } catch (err: any) {
      setError(err.message || "Failed to load job details.")
    } finally {
      setLoading(false)
    }
  }, [jobId])

  React.useEffect(() => {
    fetchJobData()
  }, [fetchJobData])

  if (loading && !job) {
    return (
      <OwnerLayout>
        <div className="space-y-6 p-2 sm:p-6">
          <SkeletonList count={4} />
        </div>
      </OwnerLayout>
    )
  }

  if (error && !job) {
    return (
      <OwnerLayout>
        <div className="p-4 sm:p-6 space-y-4">
          <Button variant="ghost" onClick={() => router.push("/owner/jobs")} className="gap-1 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Jobs
          </Button>
          <ErrorView title="Job Not Found" message={error} onRetry={fetchJobData} />
        </div>
      </OwnerLayout>
    )
  }

  const status = String(job?.status || "open").toLowerCase()
  const priority = String(job?.priority || "normal").toLowerCase()

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/owner/jobs")}
              className="h-9 px-3 text-xs font-bold rounded-xl gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs uppercase">
                  #{String(jobId).substring(0, 8)}
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
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground mt-0.5">{job?.title || "Untitled Job"}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchJobData}
              className="h-9 px-3 text-xs font-bold rounded-xl gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/owner/jobs/${jobId}/invoice-editor`)}
              className="h-9 px-3 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" /> Invoice Editor
            </Button>
          </div>
        </div>

        {/* Top Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/70 shadow-xs p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-primary" /> Client Name
            </span>
            <p className="text-sm font-extrabold text-foreground">{job?.client || job?.customer_name || "Enterprise Client"}</p>
            {job?.location && <p className="text-[11px] text-muted-foreground truncate">{job.location}</p>}
          </Card>

          <Card className="border-border/70 shadow-xs p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Job Budget
            </span>
            <p className="text-lg font-black font-mono text-foreground">₹{Number(job?.budget || job?.estimated_cost || 0).toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-muted-foreground">Estimated contract value</p>
          </Card>

          <Card className="border-border/70 shadow-xs p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-blue-500" /> Logged Hours
            </span>
            <p className="text-lg font-black font-mono text-foreground">{job?.spent_hours || 0} / {job?.estimated_hours || 8} hrs</p>
            <Progress value={Math.min(100, ((job?.spent_hours || 0) / (job?.estimated_hours || 8)) * 100)} className="h-1.5 mt-1" />
          </Card>

          <Card className="border-border/70 shadow-xs p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-purple-500" /> Assigned Technician
            </span>
            <p className="text-sm font-extrabold text-foreground truncate">{job?.accepted_by_name || job?.assigned_employee_name || "Unassigned"}</p>
            <p className="text-[11px] text-muted-foreground capitalize">Status: {job?.employee_status || "Pending"}</p>
          </Card>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scope & Verified Proofs */}
          <div className="lg:col-span-8 space-y-6">
            {/* Scope / Description */}
            {job?.description && (
              <Card className="border-border/70 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">Scope of Work &amp; Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-foreground/90 leading-relaxed italic bg-muted/30 p-3 rounded-xl border border-border/40">
                    {job.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 📸 Field Proof-of-Work Gallery */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Field Proof-of-Work &amp; Sign-Off Audit ({proofs.length})</CardTitle>
                    <CardDescription className="text-xs">
                      Live site photos, GPS check-in telemetry, and digital customer approvals.
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-mono">
                  {proofs.length} Submission{proofs.length !== 1 ? "s" : ""}
                </Badge>
              </CardHeader>

              <CardContent className="p-6">
                {proofs.length === 0 ? (
                  <div className="p-10 rounded-2xl border border-dashed border-border/70 bg-muted/20 text-center space-y-2">
                    <Camera className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <h4 className="text-xs font-bold text-foreground">No Field Proofs Submitted Yet</h4>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      When the technician captures progress photos, site notes, GPS check-ins, or collects the customer's signature on-site, they will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proofs.map((p, idx) => (
                      <div key={p.id || idx} className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>{p.uploaded_by_name || "Field Technician"}</span>
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

                        {/* Photo */}
                        {p.photo_url && (
                          <div className="relative group rounded-xl overflow-hidden border border-border/50 bg-black/5">
                            <img
                              src={p.photo_url}
                              alt="Site Progress"
                              className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={() => setSelectedPhoto(p.photo_url)}
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(p.photo_url)}
                              className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-black/75 text-white text-[11px] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                              <Maximize2 className="h-3.5 w-3.5" /> Full Size
                            </button>
                          </div>
                        )}

                        {/* Notes */}
                        {p.notes && (
                          <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded-xl leading-relaxed">
                            {p.notes}
                          </p>
                        )}

                        {/* GPS */}
                        {(p.gps_latitude || p.gps_longitude) && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <MapPin className="h-3.5 w-3.5 text-amber-500" />
                              GPS: {Number(p.gps_latitude).toFixed(4)}, {Number(p.gps_longitude).toFixed(4)}
                            </span>
                            <a
                              href={`https://www.google.com/maps?q=${p.gps_latitude},${p.gps_longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 font-bold text-xs"
                            >
                              Open Map <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {/* Customer Signature */}
                        {p.customer_signature_url && (
                          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                <Signature className="h-4 w-4" /> Customer E-Signature Sign-off
                              </span>
                              <Badge className="bg-emerald-600 text-white text-[9px]">
                                VERIFIED
                              </Badge>
                            </div>
                            <img
                              src={p.customer_signature_url}
                              alt="Customer Signature"
                              className="h-20 max-w-[240px] object-contain bg-white rounded-lg border border-border/50 p-2"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Execution Parameters & Timeline */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Job Parameters &amp; Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Priority SLA:</span>
                  <Badge variant={priority === "urgent" ? "destructive" : "outline"} className="capitalize">
                    {priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created Date:</span>
                  <span className="font-bold">{job?.created_at ? new Date(job.created_at).toLocaleDateString() : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Accepted At:</span>
                  <span className="font-bold">{job?.accepted_at ? new Date(job.accepted_at).toLocaleString() : "Not accepted"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Materials Cost:</span>
                  <span className="font-bold font-mono">₹{Number(job?.materials_cost || 0).toLocaleString("en-IN")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full Image Lightbox */}
        <Dialog open={Boolean(selectedPhoto)} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl p-3 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Site Progress Inspection Photo</DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <img src={selectedPhoto} alt="Site Proof Full" className="w-full max-h-[85vh] object-contain rounded-xl" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
