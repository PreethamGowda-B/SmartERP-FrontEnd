"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react"

interface ClockInRequiredModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ClockInRequiredModal({ isOpen, onClose }: ClockInRequiredModalProps) {
  const router = useRouter()

  const handleGoToClockIn = () => {
    onClose()
    router.push("/employee/time-tracking")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-2xl border-amber-200/80 dark:border-amber-900/50 shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="mx-auto sm:mx-0 w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              ⚠️ Clock-In Required
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              You need to clock in before performing company operations.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="my-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> Start your work shift to unlock:
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Accept Jobs</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Update Progress</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Upload Proof</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Request Materials</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Complete Jobs</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Job Actions</div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto font-medium">
            Cancel
          </Button>
          <Button onClick={handleGoToClockIn} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
            <Clock className="h-4 w-4" /> Go to Clock-In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
