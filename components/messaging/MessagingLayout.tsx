"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MessagingLayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  showChat?: boolean   // mobile: when true show right panel, hide left
}

export function MessagingLayout({ leftPanel, rightPanel, showChat = false }: MessagingLayoutProps) {
  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-background">
      {/* Left panel — conversation list */}
      <div
        className={cn(
          "w-full md:w-[320px] shrink-0 border-r flex flex-col",
          // mobile: hide when chat is open
          showChat ? "hidden md:flex" : "flex"
        )}
      >
        {leftPanel}
      </div>

      {/* Right panel — chat area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          // mobile: hide when no conversation selected
          showChat ? "flex" : "hidden md:flex"
        )}
      >
        {rightPanel}
      </div>
    </div>
  )
}
