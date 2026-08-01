"use client"

import { useState, useEffect, useRef } from "react"
import { Lock, ArrowRight, ShieldCheck, Sparkles, Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { logger } from "@/lib/logger"
import { useSubscription } from "@/contexts/subscription-context"

type FeatureLockEvent = {
  feature?: string
  current_plan?: string
  message: string
  user_role?: string
  targetPath?: string
}

const subscribers: Array<(event: FeatureLockEvent) => void> = []

export const triggerFeatureLock = (event: FeatureLockEvent) => {
  subscribers.forEach(sub => sub(event))
}

export function LockedFeaturePrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [lockData, setLockData] = useState<FeatureLockEvent | null>(null)
  const [previousPath, setPreviousPath] = useState<string>("/owner")
  const router = useRouter()
  const pathname = usePathname()
  const { isPro, isBasic } = useSubscription()
  const previousPathRef = useRef<string>("/owner")

  // Track previous path
  useEffect(() => {
    if (pathname && !pathname.includes("billing") && !pathname.includes("payment-success")) {
      previousPathRef.current = pathname
    }
  }, [pathname])

  useEffect(() => {
    const handleLock = (event: FeatureLockEvent) => {
      const suppressionKey = `suppress_lock_${event.feature || 'generic'}`
      if (typeof window !== "undefined" && sessionStorage.getItem(suppressionKey)) {
        logger.log(`[LockedFeaturePrompt] Suppression active for: ${event.feature}`)
        return
      }

      setPreviousPath(previousPathRef.current || "/owner")
      setLockData(event)
      setIsOpen(true)
    }

    subscribers.push(handleLock)
    return () => {
      const index = subscribers.indexOf(handleLock)
      if (index > -1) subscribers.splice(index, 1)
    }
  }, [])

  // Requirement 6: Automatic Unlock After Purchase
  useEffect(() => {
    const handleSubscriptionActivated = () => {
      if (isOpen) {
        console.log("⚡ [LockedFeaturePrompt] Subscription Activated! Removing Lock Screen & Opening Requested Feature...")
        setIsOpen(false)
        if (lockData?.targetPath) {
          router.push(lockData.targetPath)
        } else {
          router.refresh()
        }
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("subscription-activated", handleSubscriptionActivated)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("subscription-activated", handleSubscriptionActivated)
      }
    }
  }, [isOpen, lockData?.targetPath, router])

  // Automatically close prompt if subscription state updates to Pro
  useEffect(() => {
    if (isPro && isOpen) {
      setIsOpen(false)
    }
  }, [isPro, isOpen])

  // Requirement 5: Return User to Previous Location on close
  const handleCloseAndReturn = () => {
    if (lockData?.feature) {
      const suppressionKey = `suppress_lock_${lockData.feature}`
      sessionStorage.setItem(suppressionKey, "true")
    }
    setIsOpen(false)

    // Return to previous route
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push(previousPath || "/owner")
    }
  }

  const handleGoToBilling = (tier: "basic" | "pro" = "pro") => {
    setIsOpen(false)
    router.push(`/owner/billing?selected=${tier}`)
  }

  if (!lockData) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCloseAndReturn()
      else setIsOpen(open)
    }}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border border-border/80 shadow-2xl bg-card">
        <div className="sr-only">
          <DialogTitle>Pro Feature Locked</DialogTitle>
          <DialogDescription>Upgrade your plan to unlock this feature.</DialogDescription>
        </div>
        {/* Top Decorative Gradient Banner */}
        <div className="h-3 bg-gradient-to-r from-amber-500 via-violet-600 to-indigo-600" />

        <div className="p-6 space-y-5">
          {/* Header Icon & Title */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
                  Pro Feature Locked
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                </h3>
                <p className="text-xs text-muted-foreground">
                  Available in {lockData.feature === 'ai_assistant' ? 'Pro Plan' : 'Basic or Pro Plan'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseAndReturn}
              className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/40">
            {lockData.message || "🔒 This feature is available only in higher plan tiers. Upgrade now to unlock full automation and intelligence."}
          </p>

          {/* Benefits List */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Upgrade to unlock:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                "✨ AI Intelligence",
                "📊 Executive Analytics",
                "🧾 GST Automation",
                "💳 Payroll Intelligence",
                "🤝 CRM Automation",
                "📈 Advanced Reports",
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-1.5 font-medium text-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Buttons */}
          <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
            <Button
              onClick={() => handleGoToBilling("pro")}
              className="w-full h-11 text-xs font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg btn-premium gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Upgrade to Pro Plan</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>

            {!isBasic && (
              <Button
                onClick={() => handleGoToBilling("basic")}
                variant="outline"
                className="w-full h-10 text-xs font-semibold border-border/80 hover:bg-muted/60"
              >
                <span>Upgrade to Basic Plan</span>
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={handleCloseAndReturn}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Return to Previous Page
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
