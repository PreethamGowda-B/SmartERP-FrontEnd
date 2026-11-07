"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, WifiOff } from "lucide-react"

type NoticeState = "hidden" | "degraded" | "offline" | "service-unavailable" | "restored"
type SlowNetworkEvent = { isSlow: boolean; state?: NoticeState }

const subscribers: Array<(event: SlowNetworkEvent) => void> = []

/** Reports a slow ordinary API request without treating it as a sign-out event. */
export const triggerSlowNetworkNotice = (isSlow: boolean) => {
  subscribers.forEach((subscriber) => subscriber({ isSlow }))
}

/** Publishes an observed connection state without clearing the active session. */
export const triggerNetworkNotice = (state: NoticeState) => {
  subscribers.forEach((subscriber) => subscriber({ isSlow: state === "degraded", state }))
}

const noticeContent = {
  degraded: {
    message: "Connection is unstable. Some data may take longer to load.",
    Icon: AlertTriangle,
    classes: "border-amber-200 bg-amber-50 text-amber-900",
  },
  offline: {
    message: "You are offline. Your current data is preserved until you reconnect.",
    Icon: WifiOff,
    classes: "border-rose-200 bg-rose-50 text-rose-900",
  },
  "service-unavailable": {
    message: "SmartERP service is temporarily unavailable. Please retry shortly.",
    Icon: AlertTriangle,
    classes: "border-amber-200 bg-amber-50 text-amber-900",
  },
  restored: {
    message: "Connection restored. Updating data when available.",
    Icon: CheckCircle2,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
}

export function SlowNetworkNotice() {
  const [state, setState] = useState<NoticeState>("hidden")

  useEffect(() => {
    let restoredTimer: ReturnType<typeof setTimeout> | undefined
    const clearRestoredTimer = () => {
      if (restoredTimer) clearTimeout(restoredTimer)
      restoredTimer = undefined
    }
    const handleSlowRequest = (event: SlowNetworkEvent) => {
      if (event.state) {
        clearRestoredTimer()
        setState(event.state)
        return
      }
      if (event.isSlow) {
        clearRestoredTimer()
        setState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "degraded")
      } else {
        setState((current) => current === "degraded" ? "hidden" : current)
      }
    }
    const handleOffline = () => {
      clearRestoredTimer()
      setState("offline")
    }
    const handleOnline = () => {
      setState("restored")
      restoredTimer = setTimeout(() => setState("hidden"), 3500)
    }

    subscribers.push(handleSlowRequest)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)
    if (!navigator.onLine) setState("offline")

    return () => {
      clearRestoredTimer()
      const index = subscribers.indexOf(handleSlowRequest)
      if (index >= 0) subscribers.splice(index, 1)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  const content = state === "hidden" ? null : noticeContent[state]

  return (
    <AnimatePresence>
      {content && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[9999] max-w-sm"
        >
          <div className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg ${content.classes}`}>
            <content.Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium leading-snug">{content.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
