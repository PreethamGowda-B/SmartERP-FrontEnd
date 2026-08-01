"use client"

import { FeedbackFAB } from "./feedback-fab"
import { AIChatBot } from "./ai-chat-bot"
import { AICopilot } from "./ai-copilot"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"

/**
 * FloatingActionHub
 * 
 * Enterprise container for floating action triggers in SmartERP.
 * Ensures zero overlapping, vertical gap-3 alignment, soft elevation shadows,
 * ring hover indicators, and crisp responsiveness across all viewports.
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
    <div className="fixed bottom-6 right-6 flex flex-col-reverse items-center gap-3 z-[9999] pointer-events-none transition-all duration-300">
      {/* 1. Primary AI ChatBot Trigger */}
      {showAIAssistant && (
        <div className="pointer-events-auto rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-105 transition-all duration-300 hover:ring-2 hover:ring-primary/40">
          <AIChatBot />
        </div>
      )}

      {/* 2. Feedback Trigger */}
      <div className="pointer-events-auto rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-105 transition-all duration-300 hover:ring-2 hover:ring-primary/40">
        <FeedbackFAB />
      </div>

      {/* 3. AI Copilot Trigger */}
      {showAIAssistant && (
        <div className="pointer-events-auto rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-105 transition-all duration-300 hover:ring-2 hover:ring-primary/40">
          <AICopilot className="relative bottom-0 right-0 z-auto shadow-none" />
        </div>
      )}
    </div>
  )
}
