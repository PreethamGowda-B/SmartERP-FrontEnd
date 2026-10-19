"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Sparkles, X, ArrowRight, Zap } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
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
import { logger } from "@/lib/logger"

export function TrialWelcomeModal({ onConfirm }: { onConfirm?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [trialEligible, setTrialEligible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      try {
        const data = await apiClient("/api/subscription/status")
        if (mounted && data.is_first_login && (data.plan.is_trial || data.trial_eligible)) {
          setTrialEligible(Boolean(data.trial_eligible))
          setIsOpen(true)
        }
      } catch (err) {
        logger.error("Failed to fetch subscription status:", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    checkStatus()

    return () => { mounted = false }
  }, [])

  const handleDismiss = async () => {
    setIsOpen(false)
    try {
      await apiClient("/api/subscription/welcome-dismissed", { method: "POST" })
      if (onConfirm) onConfirm()
    } catch (err) {
      logger.error("Failed to dismiss welcome modal:", err)
    }
  }

  const handleGoToBilling = () => {
    handleDismiss()
    router.push("/owner/billing")
  }

  if (isLoading || !isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl">
        <div className="sr-only">
          <DialogTitle>Welcome to SmartERP Trial</DialogTitle>
          <DialogDescription>Your one-time ₹1 payment was verified and your 30-day Enterprise trial is active.</DialogDescription>
        </div>
        {/* Banner header */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
             <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="bg-white/20 p-4 rounded-full backdrop-blur-md shadow-2xl border border-white/30"
             >
                <Sparkles className="h-12 w-12 text-white" />
             </motion.div>
          </div>
          
          {/* Subtle animated particles */}
          <div className="absolute inset-0 opacity-30">
             {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute p-0.5 bg-white rounded-full"
                  initial={{ 
                    x: Math.random() * 600, 
                    y: Math.random() * 200,
                    opacity: Math.random()
                  }}
                  animate={{ 
                    y: [null, Math.random() * -100],
                    opacity: [null, 0]
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
             ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <DialogHeader className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 rounded-full">
                 <Zap className="h-3.5 w-3.5" />
                 {trialEligible ? "Optional 30-Day Trial" : "30-Day Enterprise Trial Active"}
               </span>
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome to SmartERP!
            </DialogTitle>
            <DialogDescription className="text-base text-zinc-600 dark:text-zinc-400">
              {trialEligible
                ? "Your company is on Starter. You can continue on Starter or pay ₹1 once to activate a 30-day Enterprise trial. The payment does not automatically renew or charge a paid plan."
                : "Your verified ₹1 payment activated the trial for 30 days. It will not automatically renew or charge a paid plan. Your access follows the Enterprise entitlements configured for your company and each user's role."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mb-8">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">{trialEligible ? "Trial terms" : "Trial billing"}</h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">₹1 is charged once for activation and does not recur. Refund terms are not displayed in the current billing setup; contact SmartERP support before paying if you need that information.</p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
            <Button 
                variant="outline" 
                onClick={handleDismiss}
                className="w-full sm:w-auto border-zinc-200 dark:border-zinc-800"
            >
              {trialEligible ? "Continue with Starter" : "Start Exploring"}
            </Button>
            <Button 
                onClick={handleGoToBilling}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-purple-500/25 transition-all"
            >
              {trialEligible ? "Review ₹1 trial" : "View Plans & Billing"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
