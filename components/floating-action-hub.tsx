"use client"

import { FeedbackFAB } from "./feedback-fab"
import { AIChatBot } from "./ai-chat-bot"

/**
 * FloatingActionHub
 * 
 * A unified container for all floating action buttons.
 * Ensures perfect vertical alignment, equal spacing, and 
 * consistent positioning in the bottom-right corner of the viewport.
 */
export function FloatingActionHub() {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-center gap-4 z-[9999] pointer-events-none">
      {/* Feedback Trigger - Wrapped to allow pointer events for the button but not empty space */}
      <div className="pointer-events-auto">
        <FeedbackFAB />
      </div>

      {/* AI Assistant Trigger - Wrapped to allow pointer events for the button */}
      <div className="pointer-events-auto">
        <AIChatBot />
      </div>
    </div>
  )
}
