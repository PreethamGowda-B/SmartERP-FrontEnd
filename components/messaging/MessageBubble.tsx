"use client"

import { cn } from "@/lib/utils"
import type { Message } from "@/types/messaging"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isTemp = String(message.id).startsWith("temp_")

  return (
    <div className={cn("flex w-full mb-1", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[70%] flex flex-col", isOwn ? "items-end" : "items-start")}>
        {/* Sender name for incoming messages */}
        {!isOwn && (
          <span className="text-xs font-semibold text-muted-foreground mb-0.5 px-1">
            {message.sender_name}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-2 rounded-2xl text-sm",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm",
            isTemp && "opacity-60"
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        {!isTemp && (
          <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
            {formatRelativeTime(message.created_at)}
          </span>
        )}
      </div>
    </div>
  )
}
