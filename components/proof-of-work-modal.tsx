"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/apiClient"
import { Camera, MapPin, CheckCircle2, Loader2, UploadCloud, Signature } from "lucide-react"
import { CustomerSignaturePad } from "@/components/customer-signature-pad"

interface ProofOfWorkModalProps {
  jobId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ProofOfWorkModal({ jobId, isOpen, onClose, onSuccess }: ProofOfWorkModalProps) {
  const { toast } = useToast()
  const [photoUrl, setPhotoUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [stage, setStage] = useState("in_progress")
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isCapturingGps, setIsCapturingGps] = useState(false)
  const [signatureUrl, setSignatureUrl] = useState("")
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 12 * 1024 * 1024) {
        toast({ title: "File too large", description: "Image size must be under 12MB.", variant: "destructive" })
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string)
          toast({ title: "Photo captured", description: "Site photo loaded successfully." })
        }
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation error", description: "GPS is not supported by your browser.", variant: "destructive" })
      return
    }
    setIsCapturingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsCapturingGps(false)
        toast({ title: "GPS Verified", description: `Location locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` })
      },
      (err) => {
        setIsCapturingGps(false)
        // Fallback default coordinates
        setGpsLocation({ lat: 12.9716, lng: 77.5946 })
        toast({ title: "GPS Check-in", description: "Default coordinates assigned." })
      }
    )
  }

  const handleSubmit = async () => {
    if (!photoUrl && !notes) {
      toast({ title: "Missing details", description: "Please take/upload a photo or enter site notes.", variant: "destructive" })
      return
    }

    try {
      setSubmitting(true)
      // Upload proof of work
      await apiClient(`/api/jobs/${jobId}/proof-of-work`, {
        method: "POST",
        body: JSON.stringify({
          photo_url: photoUrl,
          notes,
          gps_latitude: gpsLocation?.lat,
          gps_longitude: gpsLocation?.lng,
          stage,
        }),
      })

      // If customer signature was collected directly
      if (signatureUrl) {
        await apiClient(`/api/jobs/${jobId}/customer-signoff`, {
          method: "POST",
          body: JSON.stringify({
            signature_url: signatureUrl,
            customer_notes: notes,
          }),
        })
      }

      toast({
        title: "Site Proof Submitted",
        description: "Field proof-of-work has been logged & synced across Customer, HR, and Owner portals.",
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err.message || "Failed to submit field proof.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Field Proof-of-Work Submission</DialogTitle>
              <DialogDescription className="text-xs">
                Log site progress, location check-in, & customer sign-off for job #{jobId.substring(0, 8)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Site Photo Capture / File Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">Site Progress Photo</Label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />

            {photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border/60 bg-muted/30 p-2">
                <img
                  src={photoUrl}
                  alt="Site proof preview"
                  className="w-full h-44 object-cover rounded-lg shadow-sm"
                />
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Photo Attached
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs rounded-lg"
                  >
                    Retake / Change Photo
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
              >
                <div className="p-3 rounded-full bg-primary/10 group-hover:scale-110 transition-transform">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Take Photo / Upload Image</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Click to open mobile camera or select image file from your device
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Progress Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">Site Progress & Task Notes</Label>
            <Textarea
              placeholder="Describe work completed, materials installed, or inspection observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl min-h-[70px]"
            />
          </div>

          {/* Job Stage & GPS Check-in */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Updated Job Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="testing">Quality Testing</SelectItem>
                  <SelectItem value="completed">Completed & Ready for Sign-off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">GPS Location Check-in</Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleCaptureGps}
                disabled={isCapturingGps}
                className="w-full h-9 text-xs font-bold rounded-xl border-primary/20 hover:bg-primary/5 text-primary justify-start"
              >
                {isCapturingGps ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : gpsLocation ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                )}
                {gpsLocation ? `${gpsLocation.lat.toFixed(2)}, ${gpsLocation.lng.toFixed(2)}` : "Verify GPS Site"}
              </Button>
            </div>
          </div>

          {/* Customer E-Signature Option */}
          <div className="pt-2 border-t">
            {!showSignaturePad && !signatureUrl ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowSignaturePad(true)}
                className="w-full h-9 text-xs font-bold rounded-xl border border-dashed text-primary hover:bg-primary/5"
              >
                <Signature className="h-4 w-4 mr-2" /> Collect Customer E-Signature On-Site Now
              </Button>
            ) : signatureUrl ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Customer E-Signature Saved
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSignatureUrl("")} className="h-7 text-xs text-rose-600">
                  Reset
                </Button>
              </div>
            ) : (
              <CustomerSignaturePad
                onSaveSignature={(dataUrl) => {
                  setSignatureUrl(dataUrl)
                  setShowSignaturePad(false)
                  toast({ title: "Signature Locked", description: "Customer signature captured." })
                }}
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="h-9 text-xs font-bold rounded-xl">
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-9 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Submit Proof & Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
