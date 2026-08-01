"use client"

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
  return <SmartAIPanel />
}
