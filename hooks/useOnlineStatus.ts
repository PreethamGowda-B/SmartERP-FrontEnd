"use client"

import { useEffect, useRef } from "react"
import { apiClient } from "@/lib/apiClient"
import type { ConversationItem } from "@/types/messaging"

/**
 * Polls GET /api/messages/conversations every 30s as a fallback to refresh
 * online status when no SSE status_change events are being received.
 *
 * Calls the provided `onUpdate` callback with fresh conversation data so
 * the parent can update its state.
 */
export function useOnlineStatus(
  onUpdate: (conversations: ConversationItem[]) => void,
  enabled: boolean = true
) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!enabled) return

    const poll = async () => {
      try {
        const data = await apiClient("/api/messages/conversations")
        if (Array.isArray(data)) {
          onUpdateRef.current(data)
        }
      } catch {
        // Silent — this is a fallback, don't disrupt the UI
      }
    }

    const intervalId = setInterval(poll, 30_000)
    return () => clearInterval(intervalId)
  }, [enabled])
}
