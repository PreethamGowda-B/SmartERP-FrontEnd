"use client"

import { useEffect, useRef } from "react"
import { useNotifications } from "@/contexts/notification-context"

const MATERIAL_NOTIFICATION_TYPES = new Set([
  "material_request",
  "material_request_created",
  "material_purchase_bill",
  "material_purchase_correction",
])

/** Refresh material views on their SSE notifications, with a short polling fallback. */
export function useMaterialRequestRealtime(refresh: () => Promise<unknown>) {
  const { notifications, isConnected } = useNotifications()
  const seenNotificationIds = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (seenNotificationIds.current === null) {
      seenNotificationIds.current = new Set(notifications.map((notification) => String(notification.id)))
      return
    }

    let materialUpdateReceived = false
    for (const notification of notifications) {
      const id = String(notification.id)
      if (seenNotificationIds.current.has(id)) continue
      seenNotificationIds.current.add(id)
      if (MATERIAL_NOTIFICATION_TYPES.has(notification.type)) materialUpdateReceived = true
    }

    if (materialUpdateReceived) void refresh()
  }, [notifications, refresh])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    const intervalMs = isConnected ? 30000 : 10000
    const interval = window.setInterval(refreshWhenVisible, intervalMs)
    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [isConnected, refresh])
}
