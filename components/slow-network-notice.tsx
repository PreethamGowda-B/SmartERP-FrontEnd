"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Turtle, Coffee, Snail, Satellite, Wifi, Loader2 } from "lucide-react"

// Types for the event bus
type SlowNetworkEvent = {
  isSlow: boolean
}

const subscribers: Array<(event: SlowNetworkEvent) => void> = []

/**
 * Triggers the slow network notice globally
 */
export const triggerSlowNetworkNotice = (isSlow: boolean) => {
  subscribers.forEach(sub => sub({ isSlow }))
}

const MESSAGES = [
  {
    text: "🐢 The network seems slow today… SmartERP is still working on your request.",
    icon: Turtle,
    color: "text-amber-600",
    bg: "bg-amber-50"
  },
  {
    text: "☕ Looks like the internet went for a coffee break. We're trying to wake it up!",
    icon: Coffee,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    text: "🐌 Internet is in snail mode today… please hold tight while SmartERP finishes your request.",
    icon: Snail,
    color: "text-orange-600",
    bg: "bg-orange-50"
  },
  {
    text: "🛰️ Weak signal detected… SmartERP is reconnecting to the internet satellite.",
    icon: Satellite,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  {
    text: "🏃 The internet is running away today… our servers are chasing it!",
    icon: Wifi,
    color: "text-rose-600",
    bg: "bg-rose-50"
  }
]

export function SlowNetworkNotice() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeMessage, setActiveMessage] = useState(MESSAGES[0])

  useEffect(() => {
    const handleEvent = (event: SlowNetworkEvent) => {
      if (event.isSlow) {
        // Pick a random message when it becomes slow
        const randomIndex = Math.floor(Math.random() * MESSAGES.length)
        setActiveMessage(MESSAGES[randomIndex])
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    subscribers.push(handleEvent)
    return () => {
      const index = subscribers.indexOf(handleEvent)
      if (index > -1) subscribers.splice(index, 1)
    }
  }, [])

  const Icon = activeMessage.icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm"
        >
          <div className={`${activeMessage.bg} border border-current/10 shadow-2xl rounded-2xl p-4 flex items-start gap-4 backdrop-blur-md`}>
            <div className={`p-3 rounded-xl ${activeMessage.bg} border border-current/20 flex-shrink-0 relative`}>
              <Icon className={`w-6 h-6 ${activeMessage.color} ${activeMessage.icon === Wifi ? "animate-pulse" : ""}`} />
              <div className="absolute -top-1 -right-1">
                 <Loader2 className={`w-4 h-4 ${activeMessage.color} animate-spin`} />
              </div>
            </div>
            
            <div className="flex-1 space-y-1">
              <p className={`text-sm font-medium ${activeMessage.color} leading-snug`}>
                {activeMessage.text}
              </p>
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 bg-current/10 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${activeMessage.color.replace('text-', 'bg-')}`}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Processing...</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
