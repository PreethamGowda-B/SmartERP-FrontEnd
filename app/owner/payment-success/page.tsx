"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Mail,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  HeartHandshake,
  LayoutDashboard,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

const ACTIVATION_STEPS = [
  "Verifying payment signature...",
  "Activating your subscription...",
  "Updating company features...",
  "Preparing your workspace...",
  "Almost ready...",
  "Thank you for your purchase!",
]

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const orderId = searchParams.get("order_id") || "N/A"
  const paymentId = searchParams.get("payment_id") || "N/A"

  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(15)
  const [isActivated, setIsActivated] = useState(false)
  const [activePlanName, setActivePlanName] = useState<string>("Basic")
  const [isDelayed, setIsDelayed] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [pollCount, setPollCount] = useState(0)

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Persist pending payment marker to localStorage for background polling fallback
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "smarterp_pending_payment",
        JSON.stringify({ orderId, paymentId, timestamp: Date.now() })
      )
    }
  }, [orderId, paymentId])

  // Step Message Rotator
  useEffect(() => {
    if (isActivated) return

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < ACTIVATION_STEPS.length - 1 ? prev + 1 : prev))
      setProgress((prev) => Math.min(prev + 15, 95))
    }, 2200)

    return () => clearInterval(interval)
  }, [isActivated])

  // Polling Loop for Automatic Subscription Activation Verification
  const verifyStatus = useCallback(async () => {
    try {
      setPollCount((prev) => prev + 1)
      const res = await apiClient("/api/subscription/status")

      const isPaidPlan = res.plan && res.plan.id > 1 && !res.plan.is_trial
      if (isPaidPlan) {
        setIsActivated(true)
        setHasError(false)
        setActivePlanName(res.plan.name || "Pro")
        setProgress(100)

        if (typeof window !== "undefined") {
          localStorage.removeItem("smarterp_pending_payment")
          window.dispatchEvent(new CustomEvent("subscription-activated"))
        }

        toast({
          title: "🎉 Welcome to SmartERP " + (res.plan.name || "Pro") + "!",
          description: "Your subscription has been activated successfully.",
        })

        // Automatic seamless redirect to Owner Dashboard after 2 seconds
        setTimeout(() => {
          router.push("/owner")
        }, 2000)
        return
      }

      // Check if polling has exceeded 20 seconds
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed > 20000) {
        setIsDelayed(true)
      }
    } catch (err) {
      logger.error("[PAYMENT] Subscription verification poll error", err)
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed > 30000) {
        setHasError(true)
      }
    }
  }, [router, toast])

  useEffect(() => {
    verifyStatus()
    pollTimerRef.current = setInterval(verifyStatus, 3000)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [verifyStatus])

  const technicalReportData = `
========================================
🚨 SMARTERP PAYMENT ACTIVATION ISSUE REPORT
========================================
Timestamp: ${new Date().toISOString()}
Company ID: ${user?.company_id || "N/A"}
User ID: ${user?.id || "N/A"}
User Email: ${user?.email || "N/A"}
Order ID: ${orderId}
Payment ID: ${paymentId}
User Agent: ${typeof window !== "undefined" ? navigator.userAgent : "N/A"}
Poll Retries Count: ${pollCount}
Status: Pending Backend Activation Sync
========================================
`.trim()

  const handleCopyReport = () => {
    navigator.clipboard.writeText(technicalReportData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Report Copied to Clipboard",
      description: "You can paste this directly to support.",
    })
  }

  return (
    <OwnerLayout>
      <div className="flex flex-col items-center justify-center min-h-[85vh] container max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card className="text-center shadow-2xl border border-border/80 overflow-hidden bg-card">
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-primary to-accent" />

            <CardHeader className="pt-10 pb-6">
              <div className="flex justify-center mb-6">
                {isActivated ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                  </motion.div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
                {isActivated ? "🎉 Welcome to SmartERP Pro!" : "🎉 Payment Successful"}
              </CardTitle>

              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge
                  variant={isActivated ? "success" : "outline"}
                  className="text-xs px-3 py-1 font-semibold"
                >
                  {isActivated ? `Active Plan: ${activePlanName}` : "Activating Subscription..."}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-6 sm:px-10 pb-8 space-y-6">
              {/* Progress Bar & Rotating Message */}
              {!isActivated && !hasError && (
                <div className="space-y-3 bg-muted/30 p-5 rounded-2xl border border-border/60">
                  <p className="text-sm font-medium text-foreground">
                    Thank you for choosing SmartERP. We're preparing your upgraded workspace.
                  </p>
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground pt-2">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      {ACTIVATION_STEPS[stepIndex]}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-muted [&>div]:bg-primary transition-all duration-500" />
                  <p className="text-[11px] text-muted-foreground text-left">
                    No action is required. Please keep this page open while activation completes.
                  </p>
                </div>
              )}

              {/* Delayed Reassurance Banner (> 20 seconds) */}
              {isDelayed && !isActivated && !hasError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-left space-y-2"
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-600 dark:text-amber-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Payment Received Successfully</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Thank you for your purchase. We have successfully verified your payment and your money is completely safe. We're currently activating your subscription. This is taking a little longer than expected. You do <strong className="text-foreground">NOT</strong> need to pay again. We'll automatically complete the activation and take you to your dashboard.
                  </p>
                </motion.div>
              )}

              {/* Unexpected Technical Recovery Screen */}
              {hasError && !isActivated && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 text-left space-y-3"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-blue-600 dark:text-blue-400">
                    <HeartHandshake className="h-5 w-5" />
                    <span>We're Sorry for the Inconvenience</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your payment has already been verified successfully. Your money is completely safe. A temporary technical issue occurred while activating your subscription. Our system is continuing to activate your plan automatically in the background. Please feel free to open your dashboard below.
                  </p>
                </motion.div>
              )}

              {/* Activated Confirmation Body */}
              {isActivated && (
                <div className="space-y-4 text-left bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                    <span>Workspace Upgraded to SmartERP {activePlanName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your subscription has been activated successfully. Features, limits, and team permissions have been updated.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-muted/20 border-t border-border/70 p-6 flex flex-col sm:flex-row gap-3">
              {/* Continue to Dashboard Button */}
              <Button
                asChild
                className="w-full sm:w-1/2 h-11 text-xs font-bold btn-premium"
              >
                <Link href="/owner">
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {/* Emergency Report Button */}
              <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-1/2 h-11 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 gap-1.5"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>🚨 Report Payment Issue</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                      Report Payment Activation Issue
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      If your payment was deducted but your subscription is not active yet, use this pre-filled diagnostic payload to contact our engineering support immediately.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-muted rounded-lg font-mono text-[11px] space-y-1 overflow-x-auto text-foreground max-h-48">
                      <pre>{technicalReportData}</pre>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs gap-1.5" onClick={handleCopyReport}>
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy Diagnostics"}
                      </Button>
                      <Button size="sm" className="flex-1 text-xs btn-premium" asChild>
                        <a href={`mailto:support@prozync.in?subject=SmartERP%20Payment%20Issue%20-%20Order%20${orderId}&body=${encodeURIComponent(technicalReportData)}`}>
                          <Mail className="h-3.5 w-3.5 mr-1" /> Email Support
                        </a>
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </OwnerLayout>
  )
}
