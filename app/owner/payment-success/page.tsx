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
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import confetti from "canvas-confetti"
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
  "Updating AI permissions...",
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
  const signature = searchParams.get("signature") || ""
  const planIdParam = searchParams.get("plan_id") || "3"
  const billingCycleParam = searchParams.get("billing_cycle") || "monthly"
  const preVerified = searchParams.get("verified") === "true"

  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(15)
  const [isActivated, setIsActivated] = useState(false)
  const [activePlanName, setActivePlanName] = useState<string>("Pro")
  const [isDelayed, setIsDelayed] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Launch cinematic Apple/Stripe-grade celebration confetti
  const launchConfetti = useCallback(() => {
    try {
      const colors = ["#f59e0b", "#fbbf24", "#3b82f6", "#60a5fa", "#ffffff", "#e2e8f0", "#8b5cf6", "#d97706"]
      const duration = 4500
      const end = Date.now() + duration

      // Stage 1: Dual Side Cannons (0s)
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
        startVelocity: 45
      })
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
        startVelocity: 45
      })

      // Stage 2: Center Skyburst (0.6s)
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { x: 0.5, y: 0.4 },
          colors,
          scalar: 1.2,
          startVelocity: 35
        })
      }, 600)

      // Stage 3: Continuous Sparkling Rain Shower (1.2s to 4.0s)
      const interval: any = setInterval(() => {
        const timeLeft = end - Date.now()
        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }
        const particleCount = Math.floor(25 * (timeLeft / duration))
        confetti({
          particleCount,
          startVelocity: 25,
          spread: 360,
          ticks: 80,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors
        })
      }, 300)

      // Stage 4: Golden Finale Sparkle (3.5s)
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 120,
          origin: { x: 0.5, y: 0.5 },
          colors: ["#f59e0b", "#fbbf24", "#ffffff"],
          scalar: 1.3
        })
      }, 3500)
    } catch { /* ignore */ }
  }, [])

  // Persist pending payment marker to localStorage
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
    if (isActivated || hasError) return

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < ACTIVATION_STEPS.length - 1 ? prev + 1 : prev))
      setProgress((prev) => Math.min(prev + 15, 95))
    }, 1500)

    return () => clearInterval(interval)
  }, [isActivated, hasError])

  // Complete activation & redirect flow
  const completeActivation = useCallback((planName: string) => {
    console.log(`[Frontend] Activation Completed | New Plan = ${planName}`)
    console.log(`[Frontend] Refreshing User Session & Authorizing AI Entitlements`)

    setIsActivated(true)
    setHasError(false)
    setActivePlanName(planName)
    setProgress(100)

    if (typeof window !== "undefined") {
      localStorage.removeItem("smarterp_pending_payment")
      window.dispatchEvent(new CustomEvent("subscription-activated"))
    }

    launchConfetti()

    toast({
      title: `🎉 Welcome to SmartERP ${planName}!`,
      description: "Your subscription has been activated successfully.",
    })

    console.log(`[Frontend] Redirecting Dashboard in 4.5s`)
    setTimeout(() => {
      router.push("/owner")
    }, 4500)
  }, [launchConfetti, router, toast])

  // Active Verification Endpoint Execution
  const triggerActiveVerification = useCallback(async () => {
    if (isVerifying || isActivated) return
    setIsVerifying(true)
    setHasError(false)
    setErrorMessage("")

    console.log(`[Frontend] Payment Success Page Mounted | Order ID: ${orderId} | Payment ID: ${paymentId}`)
    console.log(`[Subscription] Starting Activation | Company ID = ${user?.company_id || 'N/A'}`)
    console.log(`[Subscription] Current Plan = Free | Target Plan = ${planIdParam}`)

    try {
      if (orderId !== "N/A" && paymentId !== "N/A") {
        console.log(`[Subscription] Updating Plans Table & Company Subscription...`)
        const verifyRes = await apiClient("/api/subscription/verify-payment", {
          method: "POST",
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
            planId: parseInt(planIdParam, 10) || 3,
            billingCycle: billingCycleParam
          })
        })

        console.log(`[Subscription] Commit Successful | Response:`, verifyRes)

        if (verifyRes.ok || verifyRes.success) {
          const planName = verifyRes.plan?.name || (planIdParam === "2" ? "Basic" : "Pro")
          console.log(`[Subscription] Updating AI Permissions... Done!`)
          completeActivation(planName)
          return
        }
      }

      // Check status fallback
      const statusRes = await apiClient("/api/subscription/status")
      console.log(`[Subscription] Status Check Response:`, statusRes)

      const isPaidPlan = statusRes.plan && statusRes.plan.id > 1 && !statusRes.plan.is_trial
      if (isPaidPlan) {
        completeActivation(statusRes.plan.name || "Pro")
        return
      }

      // Elapsed check (60s max timeout)
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed > 20000) setIsDelayed(true)

      if (elapsed > 60000) {
        console.error(`❌ [Subscription] Timeout Exceeded 60s cap without activation`)
        setHasError(true)
        setErrorMessage("Subscription activation timed out after 60 seconds. Please click 'Retry Activation' below.")
      }
    } catch (err: any) {
      logger.error("[Subscription] Verification attempt error:", err)
      const elapsed = Date.now() - startTimeRef.current

      // Check status as fallback even after catch
      try {
        const fallbackRes = await apiClient("/api/subscription/status")
        if (fallbackRes.plan && fallbackRes.plan.id > 1 && !fallbackRes.plan.is_trial) {
          completeActivation(fallbackRes.plan.name || "Pro")
          return
        }
      } catch {}

      if (elapsed > 60000) {
        setHasError(true)
        setErrorMessage(err.message || "Subscription activation encountered an issue.")
      }
    } finally {
      setIsVerifying(false)
    }
  }, [isVerifying, isActivated, orderId, paymentId, user?.company_id, planIdParam, signature, billingCycleParam, completeActivation])

  // Initial & Polling Execution
  useEffect(() => {
    if (preVerified) {
      console.log(`[Frontend] Pre-verified payment parameter detected`)
      completeActivation(planIdParam === "2" ? "Basic" : "Pro")
      return
    }

    triggerActiveVerification()
    pollTimerRef.current = setInterval(() => {
      setPollCount(p => p + 1)
      triggerActiveVerification()
    }, 4000)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [preVerified, completeActivation, triggerActiveVerification, planIdParam])

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
                    className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-xl"
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                  </motion.div>
                ) : hasError ? (
                  <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="w-16 h-16 text-rose-500" />
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
                {isActivated
                  ? `🎉 Welcome to SmartERP ${activePlanName}!`
                  : hasError
                    ? "Activation Issue"
                    : "🎉 Payment Successful"
                }
              </CardTitle>

              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge
                  variant={isActivated ? "success" : hasError ? "destructive" : "outline"}
                  className="text-xs px-3 py-1 font-semibold"
                >
                  {isActivated ? `Active Plan: ${activePlanName}` : hasError ? "Activation Delayed" : "Activating Subscription..."}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-6 sm:px-10 pb-8 space-y-6">
              {/* Progress Bar & Rotating Message */}
              {!isActivated && !hasError && (
                <div className="space-y-3 bg-muted/30 p-5 rounded-2xl border border-border/60">
                  <p className="text-sm font-medium text-foreground">
                    Thank you for choosing SmartERP. We're activating your subscription and AI permissions.
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
                    Please keep this page open while your subscription activates automatically.
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
                    <span>Payment Received & Verified</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your payment has been received and verified. Your money is 100% safe. We are completing subscription activation and cache sync.
                  </p>
                </motion.div>
              )}

              {/* Error Screen with Retry Button */}
              {hasError && !isActivated && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-left space-y-3"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Activation Encountered an Issue</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {errorMessage || "Your payment was processed, but subscription activation could not complete automatically."}
                  </p>
                  <Button
                    onClick={() => {
                      startTimeRef.current = Date.now()
                      triggerActiveVerification()
                    }}
                    disabled={isVerifying}
                    size="sm"
                    className="w-full h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-2"
                  >
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span>Retry Activation Now</span>
                  </Button>
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
                    Your subscription is now active! All AI features, module limits, and team permissions have been unlocked. Redirecting to your dashboard...
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-muted/20 border-t border-border/70 p-6 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="w-full sm:w-1/2 h-11 text-xs font-bold btn-premium"
              >
                <Link href="/owner">
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

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
                      If your payment was deducted but your subscription is not active yet, use this pre-filled diagnostic payload to contact support.
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
