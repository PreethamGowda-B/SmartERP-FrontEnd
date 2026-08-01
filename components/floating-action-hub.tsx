"use client"

import { FeedbackFAB } from "./feedback-fab"
import { AIChatBot } from "./ai-chat-bot"
import { AICopilot } from "./ai-copilot"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"

/**
 * FloatingActionHub
 * 
 * Unified container for all floating action buttons in SmartERP.
 * Guarantees zero overlapping, perfect vertical spacing (gap-3.5),
 * correct z-index hierarchy, smooth animations, and full responsiveness.
 * Hides completely on public pages, auth routes, and customer portals.
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
    <div className="fixed bottom-6 right-6 flex flex-col-reverse items-center gap-3.5 z-[9999] pointer-events-none transition-all duration-300">
      {/* 1. Primary AI ChatBot Trigger */}
      {showAIAssistant && (
        <div className="pointer-events-auto shadow-lg hover:shadow-xl transition-shadow rounded-full">
          <AIChatBot />
        </div>
      )}

      {/* 2. Feedback Trigger */}
      <div className="pointer-events-auto shadow-lg hover:shadow-xl transition-shadow rounded-full">
        <FeedbackFAB />
      </div>

      {/* 3. AI Copilot Trigger */}
      {showAIAssistant && (
        <div className="pointer-events-auto shadow-lg hover:shadow-xl transition-shadow rounded-full">
          <AICopilot className="relative bottom-0 right-0 z-auto shadow-none" />
        </div>
      )}
    </div>
  )
}
