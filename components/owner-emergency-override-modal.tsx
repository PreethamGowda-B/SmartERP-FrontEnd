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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ShieldAlert, AlertTriangle, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"

interface OwnerEmergencyOverrideModalProps {
  jobId: string
  jobTitle: string
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
}

export function OwnerEmergencyOverrideModal({
  jobId,
  jobTitle,
  isOpen,
  onClose,
  onActionComplete,
}: OwnerEmergencyOverrideModalProps) {
  const [actionType, setActionType] = React.useState<string>("force_complete")
  const [overrideReason, setOverrideReason] = React.useState<string>("")
  const [overrideProgress, setOverrideProgress] = React.useState<number>(100)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!overrideReason || !overrideReason.trim()) {
      toast.error("A compulsory reason is required for Emergency Override.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await apiClient<{ success: boolean; message: string }>(`/api/jobs/${jobId}/override`, {
        method: "POST",
        body: JSON.stringify({
          action_type: actionType,
          reason: overrideReason.trim(),
          new_progress: actionType === "override_progress" ? overrideProgress : undefined,
        }),
      })

      if (res && res.success) {
        toast.success(res.message || "Emergency override executed cleanly.")
        onClose()
        setOverrideReason("")
        if (onActionComplete) onActionComplete()
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to execute emergency override")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl max-w-md border-amber-300 dark:border-amber-900 bg-card">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-6 w-6 shrink-0" />
            <DialogTitle className="text-base font-black">Owner Emergency Override</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Execute supervisory intervention for <strong className="text-foreground">{jobTitle}</strong>. All overrides write an immutable record to the enterprise audit log.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Override Action Type</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Select override action" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="force_complete">Force Complete Job (100%)</SelectItem>
                <SelectItem value="return_to_assigned">Return Job to Unassigned Pool</SelectItem>
                <SelectItem value="override_progress">Set Custom Progress Percentage</SelectItem>
                <SelectItem value="cancel_job">Cancel Job Entirely</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {actionType === "override_progress" && (
            <div className="space-y-2 p-3 bg-muted/40 rounded-xl border">
              <div className="flex justify-between items-center text-xs font-bold">
                <span>Set Progress:</span>
                <span className="font-mono text-primary">{overrideProgress}%</span>
              </div>
              <Slider
                value={[overrideProgress]}
                onValueChange={(val) => setOverrideProgress(val[0])}
                max={100}
                step={5}
                className="py-1 cursor-pointer"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-foreground">Compulsory Reason / Justification</Label>
              <span className="text-[10px] font-bold text-rose-500">* Required</span>
            </div>
            <Textarea
              placeholder="Explain why this supervisory override is required (e.g., Assigned technician absent, customer emergency, hardware replacement)..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              required
              className="text-xs rounded-xl min-h-[90px]"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>This action will be logged in the immutable audit trail with your User ID and timestamp.</span>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !overrideReason.trim()}
              className="h-8 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Execute Override
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
