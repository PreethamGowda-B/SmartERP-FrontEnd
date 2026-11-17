"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, WifiOff } from "lucide-react"

type NoticeState = "hidden" | "degraded" | "offline" | "service-unavailable" | "restored"
type VisibleNoticeState = Exclude<NoticeState, "hidden">
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

const noticeContent: Record<VisibleNoticeState, {
  eyebrow: string
  title: string
  messages: string[]
  Icon: typeof AlertTriangle
  classes: string
  iconClasses: string
}> = {
  degraded: {
    eyebrow: "Connection check",
    title: "Your connection needs attention",
    messages: [
      "Your signal is fluctuating. Some updates may take a little longer to appear.",
      "We’re still connected, but response times are slower than usual. Please keep this page open.",
      "Network quality is changing. Your current work remains safely on screen while we reconnect.",
    ],
    Icon: AlertTriangle,
    classes: "border-amber-200/90 bg-amber-50/95 text-amber-950",
    iconClasses: "bg-amber-100 text-amber-700",
  },
  offline: {
    eyebrow: "Connection status: offline",
    title: "You’re currently offline",
    messages: [
      "Check your internet connection. We’ll refresh your workspace as soon as you’re back online.",
      "Your connection is out of service. Review your Wi-Fi or mobile data, then try again.",
      "SmartERP can’t reach the network right now. Your visible work stays available until you reconnect.",
    ],
    Icon: WifiOff,
    classes: "border-rose-200/90 bg-rose-50/95 text-rose-950",
    iconClasses: "bg-rose-100 text-rose-700",
  },
  "service-unavailable": {
    eyebrow: "Service update",
    title: "SmartERP is temporarily unavailable",
    messages: [
      "Our service is taking a short pause. Please wait a moment, then try again.",
      "Your internet may be working normally. SmartERP is reconnecting to the service.",
      "We’re checking the service connection. Your session remains active while we restore access.",
    ],
    Icon: AlertTriangle,
    classes: "border-amber-200/90 bg-amber-50/95 text-amber-950",
    iconClasses: "bg-amber-100 text-amber-700",
  },
  restored: {
    eyebrow: "Connection restored",
    title: "You’re back online",
    messages: ["Your connection is active again. SmartERP is refreshing available data."],
    Icon: CheckCircle2,
    classes: "border-emerald-200/90 bg-emerald-50/95 text-emerald-950",
    iconClasses: "bg-emerald-100 text-emerald-700",
  },
}

export function SlowNetworkNotice() {
  const [state, setState] = useState<NoticeState>("hidden")
  const [messageIndex, setMessageIndex] = useState(0)

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

  useEffect(() => {
    setMessageIndex(0)
    if (!content || content.messages.length < 2) return
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % content.messages.length)
    }, 5500)
    return () => window.clearInterval(messageTimer)
  }, [state, content])

  const message = content ? content.messages[messageIndex % content.messages.length] : ""

  return (
    <AnimatePresence>
      {content && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[9999] w-[calc(100%_-_2.5rem)] max-w-md sm:bottom-6 sm:right-6"
        >
          <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur ${content.classes}`}>
            <div className="flex items-start gap-3.5">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${content.iconClasses}`}>
                <content.Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 pr-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-65">{content.eyebrow}</p>
                <p className="text-sm font-bold tracking-tight">{content.title}</p>
                <motion.p
                  key={`${state}-${messageIndex}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1.5 text-sm leading-relaxed opacity-80"
                >
                  {message}
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
