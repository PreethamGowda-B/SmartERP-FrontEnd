"use client"

import { cn } from "@/lib/utils"
import { Check, CheckCheck } from "lucide-react"
import { AttachmentPreview } from "./AttachmentPreview"
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

function ReceiptIcon({ status }: { status: Message["receipt"] }) {
  if (!status || status === "sent") {
    // Single gray tick
    return <Check className="h-3 w-3 text-primary-foreground/50" aria-label="Sent" />
  }
  if (status === "delivered") {
    // Double gray tick
    return <CheckCheck className="h-3 w-3 text-primary-foreground/50" aria-label="Delivered" />
  }
  // read — double blue tick
  return <CheckCheck className="h-3 w-3 text-blue-300" aria-label="Read" />
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isTemp = String(message.id).startsWith("temp_")
  const hasTextContent = message.content && message.content.trim().length > 0

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
            isTemp && "opacity-60",
            // Remove horizontal padding if only an image attachment and no text
            !hasTextContent && message.attachment?.file_type.startsWith("image/") && "p-1"
          )}
        >
          {/* Attachment (rendered above text if both present) */}
          {message.attachment && (
            <AttachmentPreview attachment={message.attachment} isOwn={isOwn} />
          )}

          {/* Text content */}
          {hasTextContent && (
            <p className="whitespace-pre-wrap wrap-break-word leading-relaxed mt-1">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp + receipt */}
        {!isTemp && (
          <div className={cn("flex items-center gap-1 mt-0.5 px-1", isOwn ? "flex-row-reverse" : "flex-row")}>
            <span className="text-[10px] text-muted-foreground">
              {formatRelativeTime(message.created_at)}
            </span>
            {isOwn && (
              <ReceiptIcon status={message.receipt} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
