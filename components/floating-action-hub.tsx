"use client"

import { useState, useEffect } from "react"
import { SmartAIPanel } from "./smart-ai-panel"

/**
 * FloatingActionHub
 *
 * Single unified entry point for the SmartERP Intelligence Hub.
 * Replaces the previous three separate floating buttons (AIChatBot, FeedbackFAB, AICopilot)
 * with one premium enterprise AI panel that orchestrates all three internally.
 *
 * The legacy components (ai-chat-bot.tsx, ai-copilot.tsx, feedback-fab.tsx)
 * remain intact for reuse within smart-ai-panel.tsx as internal modules.
 */
export function FloatingActionHub() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <SmartAIPanel />
}
