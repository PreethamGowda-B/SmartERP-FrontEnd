"use client"

import { FeedbackFAB } from "./feedback-fab"
import { AIChatBot } from "./ai-chat-bot"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"

/**
 * FloatingActionHub
 * 
 * A unified container for all floating action buttons.
 * Ensures perfect vertical alignment, equal spacing, and 
 * consistent positioning in the bottom-right corner of the viewport.
 * Hides completely on public landing pages, auth pages, and customer portals.
 */
export function FloatingActionHub() {
  const { user } = useAuth()
  const pathname = usePathname()

  // Hide completely on public marketing landing pages, auth, and customer portal routes
  const isPublicPage =
    !pathname ||
    pathname === "/" ||
    pathname === "/customer/landing" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/customer") ||
    pathname === "/privacy" ||
    pathname === "/terms"

  if (isPublicPage) {
    return null
  }

  // Only show after login (when user object exists)
  const showAIAssistant = !!user

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-center gap-3 sm:gap-4 z-[9999] pointer-events-none transition-all duration-300">
      {/* Feedback Trigger */}
      <div className="pointer-events-auto shadow-lg hover:shadow-xl transition-shadow rounded-full">
        <FeedbackFAB />
      </div>

      {/* AI Assistant Trigger */}
      {showAIAssistant && (
        <div className="pointer-events-auto shadow-lg hover:shadow-xl transition-shadow rounded-full">
          <AIChatBot />
        </div>
      )}
    </div>
  )
}
