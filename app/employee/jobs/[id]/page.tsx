"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { EmployeeLayout } from "@/components/employee-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  User,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Signature,
  ArrowLeft,
  RefreshCw,
  Maximize2,
  UploadCloud,
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { ProofOfWorkModal } from "@/components/proof-of-work-modal"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { ErrorView } from "@/components/ui/error-view"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function EmployeeJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.id as string

  const [mounted, setMounted] = React.useState(false)
  const [job, setJob] = React.useState<any | null>(null)
  const [proofs, setProofs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isProofModalOpen, setIsProofModalOpen] = React.useState(false)
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const fetchJobData = React.useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      const allJobs = await apiClient<any>("/api/jobs")
      const list = Array.isArray(allJobs) ? allJobs : allJobs?.jobs || []
      const found = list.find((j: any) => String(j.id) === String(jobId))
      if (found) {
        setJob(found)
      } else {
        const singleJob = await apiClient<any>(`/api/jobs/${jobId}`).catch(() => null)
        if (singleJob) setJob(singleJob?.job || singleJob)
        else throw new Error("Job assignment not found.")
      }

      const proofRes = await apiClient<any>(`/api/jobs/${jobId}/proof-of-work`).catch(() => ({ proofs: [] }))
      setProofs(proofRes?.proofs || (Array.isArray(proofRes) ? proofRes : []))
    } catch (err: any) {
      setError(err.message || "Failed to load job details.")
    } finally {
      setLoading(false)
    }
  }, [jobId])

  React.useEffect(() => {
    if (mounted) {
      fetchJobData()
    }
  }, [mounted, fetchJobData])

  if (!mounted || (loading && !job)) {
    return (
      <EmployeeLayout>
        <div className="space-y-6 p-4">
          <SkeletonList count={3} />
        </div>
      </EmployeeLayout>
    )
  }

  if (error && !job) {
    return (
      <EmployeeLayout>
        <div className="p-4 space-y-4">
          <Button variant="ghost" onClick={() => router.push("/employee/jobs")} className="gap-1 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to My Jobs
          </Button>
          <ErrorView title="Job Not Found" message={error} onRetry={fetchJobData} />
        </div>
      </EmployeeLayout>
    )
  }

  const status = String(job?.status || "open").toLowerCase()

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/employee/jobs")}
              className="h-9 px-3 text-xs font-bold rounded-xl gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Tasks
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
              <h1 className="text-2xl font-black tracking-tight text-foreground mt-0.5">{job?.title || "Assigned Task"}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchJobData}
              className="h-9 px-3 text-xs font-bold rounded-xl gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIsProofModalOpen(true)}
              className="h-9 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
            >
              <Camera className="h-3.5 w-3.5" /> Submit Site Proof
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/70 p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-primary" /> Client &amp; Location
            </span>
            <p className="text-sm font-extrabold text-foreground">{job?.client || job?.customer_name || "Enterprise Client"}</p>
            {job?.location && <p className="text-[11px] text-muted-foreground">{job.location}</p>}
          </Card>

          <Card className="border-border/70 p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-blue-500" /> Allocated Hours
            </span>
            <p className="text-lg font-black font-mono text-foreground">{job?.spent_hours || 0} / {job?.estimated_hours || 8} hrs</p>
          </Card>

          <Card className="border-border/70 p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-amber-500" /> Start Date
            </span>
            <p className="text-sm font-bold text-foreground">
              {job?.startDate || job?.created_at ? new Date(job.startDate || job.created_at).toLocaleDateString() : "—"}
            </p>
          </Card>
        </div>

        {/* Proof of Work Submissions */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-500" />
              Site Proof Submissions ({proofs.length})
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsProofModalOpen(true)}
              className="h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Upload New Proof
            </Button>
          </CardHeader>

          <CardContent className="p-6">
            {proofs.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-border/70 bg-muted/20 text-center space-y-2">
                <Camera className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-xs font-bold text-foreground">No Proof Uploaded for this Job</p>
                <p className="text-[11px] text-muted-foreground">Click &quot;Submit Site Proof&quot; to take a photo and log GPS check-in.</p>
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
                        {p.created_at || p.signed_at ? new Date(p.created_at || p.signed_at).toLocaleString() : ""}
                      </span>
                    </div>

                    {p.photo_url && (
                      <div className="relative group rounded-xl overflow-hidden border border-border/50 bg-black/5">
                        <img
                          src={p.photo_url}
                          alt="Site Progress"
                          className="w-full h-44 object-cover cursor-pointer"
                          onClick={() => setSelectedPhoto(p.photo_url)}
                        />
                      </div>
                    )}

                    {p.notes && <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded-xl">{p.notes}</p>}

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
                          Map <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {p.customer_signature_url && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1">
                          <Signature className="h-3.5 w-3.5" /> Customer Sign-Off Verified
                        </span>
                        <img
                          src={p.customer_signature_url}
                          alt="Customer Signature"
                          className="h-16 max-w-[200px] object-contain bg-white rounded border p-1"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mounted Proof of Work Modal */}
        <ProofOfWorkModal
          jobId={jobId}
          isOpen={isProofModalOpen}
          onClose={() => setIsProofModalOpen(false)}
          onSuccess={fetchJobData}
        />

        {/* Lightbox */}
        <Dialog open={Boolean(selectedPhoto)} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl p-3 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xs font-bold">Site Progress Photo</DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <img src={selectedPhoto} alt="Site Proof Full" className="w-full max-h-[80vh] object-contain rounded-xl" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  )
}
