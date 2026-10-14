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
    <div className="flex h-full w-full min-h-0 overflow-hidden bg-background">
      {/* Left panel — conversation list */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-85 shrink-0 border-r flex flex-col h-full min-h-0 overflow-hidden bg-background",
          // mobile: hide when chat is open
          showChat ? "hidden md:flex" : "flex"
        )}
      >
        {leftPanel}
      </div>

      {/* Right panel — chat area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 h-full min-h-0 overflow-hidden bg-background",
          // mobile: hide when no conversation selected
          showChat ? "flex" : "hidden md:flex"
        )}
      >
        {rightPanel}
      </div>
    </div>
  )
}
