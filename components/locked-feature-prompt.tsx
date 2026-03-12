"use client"

import { useState, useEffect } from "react"
import { Lock, ArrowRight, ShieldAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Global event bus for intercepting upgrade required errors
type FeatureLockEvent = {
  feature?: string
  message: string
}

const subscribers: Array<(event: FeatureLockEvent) => void> = []

export const triggerFeatureLock = (event: FeatureLockEvent) => {
  subscribers.forEach(sub => sub(event))
}

export function LockedFeaturePrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [lockData, setLockData] = useState<FeatureLockEvent | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleLock = (event: FeatureLockEvent) => {
      setLockData(event)
      setIsOpen(true)
    }

    subscribers.push(handleLock)
    return () => {
      const index = subscribers.indexOf(handleLock)
      if (index > -1) subscribers.splice(index, 1)
    }
  }, [])

  const handleGoToBilling = () => {
    setIsOpen(false)
    router.push("/owner/billing")
  }

  if (!lockData) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-[100px] pointer-events-none -z-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-tr-[80px] pointer-events-none -z-10 blur-xl"></div>
        
        <DialogHeader className="space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center shadow-inner border border-rose-200 dark:border-rose-800">
                <Lock className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
          <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight text-center">
            Feature Locked
          </DialogTitle>
          <DialogDescription className="text-base text-center leading-relaxed text-zinc-600 dark:text-zinc-400">
            {lockData.message || "This feature is not available on your current plan."}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 my-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
                Upgrade to a higher tier plan to unlock {lockData.feature ? <strong className="text-zinc-900 dark:text-white">{lockData.feature.replace(/_/g, " ")}</strong> : "this feature"} and scale your business without limits.
            </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleGoToBilling} className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all">
            See Upgrade Options <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
