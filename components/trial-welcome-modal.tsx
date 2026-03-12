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

export function TrialWelcomeModal({ onConfirm }: { onConfirm?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      try {
        const data = await apiClient("/api/subscription/status")
        if (mounted && data.is_first_login && data.plan.is_trial) {
          setIsOpen(true)
        }
      } catch (err) {
        console.error("Failed to fetch subscription status:", err)
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
      console.error("Failed to dismiss welcome modal:", err)
    }
  }

  const handleGoToBilling = () => {
    handleDismiss()
    router.push("/owner/billing")
  }

  if (isLoading || !isOpen) return null

  const proFeatures = [
    "AI-powered Smart Assistant",
    "Real-time GPS Location Tracking",
    "Automated Payroll Generation",
    "Unlimited Inventory Items & Images",
    "Advanced Analytics & Exportable Reports"
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl">
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
                 30-Day Pro Trial Active
               </span>
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome to SmartERP!
            </DialogTitle>
            <DialogDescription className="text-base text-zinc-600 dark:text-zinc-400">
              We've unlocked all our premium tools so you can experience the full power of our platform. Your Pro trial ends in 30 days. No credit card required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mb-8">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">What's included:</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {proFeatures.map((feature, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 font-medium"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
            <Button 
                variant="outline" 
                onClick={handleDismiss}
                className="w-full sm:w-auto border-zinc-200 dark:border-zinc-800"
            >
              Start Exploring
            </Button>
            <Button 
                onClick={handleGoToBilling}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-purple-500/25 transition-all"
            >
              View Plans & Billing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
