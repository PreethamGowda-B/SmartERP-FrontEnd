"use client"

import { useEffect, useRef } from "react"
import { apiClient, getAccessToken } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"

export function BackgroundSubscriptionPoller() {
  const { toast } = useToast()
  const pollerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if there is an unconfirmed payment pending in localStorage
    const pendingPayment = typeof window !== "undefined" ? localStorage.getItem("smarterp_pending_payment") : null

    if (!pendingPayment) return

    logger.log("[PAYMENT POLLER] Background activation poller active for pending transaction...")

    const checkActivation = async () => {
      if (!getAccessToken()) return

      try {
        const res = await apiClient("/api/subscription/status")
        const isPaidPlan = res.plan && res.plan.id > 1 && !res.plan.is_trial

        if (isPaidPlan) {
          // Success! Clear pending payment flag
          localStorage.removeItem("smarterp_pending_payment")

          if (pollerRef.current) clearInterval(pollerRef.current)

          // Dispatch event to refresh layout state
          window.dispatchEvent(new CustomEvent("subscription-activated"))

          toast({
            title: "🎉 Your SmartERP Subscription is Active!",
            description: `Upgraded to ${res.plan.name || "Pro"} Plan. All features are now unlocked.`,
          })
        }
      } catch (err) {
        logger.error("[PAYMENT POLLER] Background status check error", err)
      }
    }

    checkActivation()
    pollerRef.current = setInterval(checkActivation, 5000)

    // Timeout poller after 10 minutes to prevent perpetual polling
    const timeoutTimer = setTimeout(() => {
      if (pollerRef.current) clearInterval(pollerRef.current)
      localStorage.removeItem("smarterp_pending_payment")
    }, 600000)

    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current)
      clearTimeout(timeoutTimer)
    }
  }, [toast])

  return null
}
