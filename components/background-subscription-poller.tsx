"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { apiClient, getAccessToken, isTokenExpired } from "@/lib/apiClient"
import { isPublicRoute } from "@/lib/route-utils"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"

export function BackgroundSubscriptionPoller() {
  const { toast } = useToast()
  const pathname = usePathname()
  const isPublic = isPublicRoute(pathname)
  const pollerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isPublic) return
    const token = getAccessToken()
    if (!token || isTokenExpired(token)) return

    // Check if there is an unconfirmed payment pending in localStorage
    const pendingPayment = typeof window !== "undefined" ? localStorage.getItem("smarterp_pending_payment") : null

    if (!pendingPayment) return

    logger.log("[PAYMENT POLLER] Background activation poller active for pending transaction...")

    const checkActivation = async () => {
      const at = getAccessToken()
      if (!at || isTokenExpired(at)) {
        if (pollerRef.current) clearInterval(pollerRef.current)
        return
      }

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
      } catch (err: any) {
        if (err?.message?.includes("expired") || err?.message?.includes("log in") || err?.message?.includes("401")) {
          if (pollerRef.current) clearInterval(pollerRef.current)
          localStorage.removeItem("smarterp_pending_payment")
        }
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
  }, [toast, isPublic])

  return null
}
