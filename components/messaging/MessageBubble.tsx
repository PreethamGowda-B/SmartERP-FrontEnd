"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Check, CheckCheck, Play } from "lucide-react"
import { AttachmentPreview } from "./AttachmentPreview"
import { ErpChatCard } from "@/components/erp-chat-card"
import type { Message, MessageAttachment } from "@/types/messaging"

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
    return <Check className="h-3 w-3 text-primary-foreground/50" aria-label="Sent" />
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3 w-3 text-primary-foreground/50" aria-label="Delivered" />
  }
  // read — double blue tick
  return <CheckCheck className="h-3 w-3 text-blue-300" aria-label="Read" />
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isTemp = String(message.id).startsWith("temp_")
  const isErpCard = message.message_type === "erp_card"
  const mediaUrl = message.attachment?.media_url || message.attachment?.file_url || (message as any).media_url
  const isAudio = message.message_type === "audio" || message.attachment?.media_type === "audio" || (message as any).media_type === "audio" || Boolean(message.attachment?.file_type?.startsWith("audio/"))
  const isImage = message.message_type === "image" || message.attachment?.media_type === "image" || Boolean(message.attachment?.file_type?.startsWith("image/")) || (message as any).media_type === "image"
  const hasTextContent = Boolean(message.content && message.content.trim().length > 0 && message.content.trim() !== "🎤 Voice Note")

  const effectiveAttachment: MessageAttachment | undefined = message.attachment || (mediaUrl ? {
    file_url: mediaUrl,
    media_url: mediaUrl,
    file_name: (message as any).file_name || (isAudio ? "Voice Note" : isImage ? "Photo" : "Attachment"),
    file_type: isImage ? "image/jpeg" : isAudio ? "audio/webm" : "application/octet-stream",
    media_type: isImage ? "image" : isAudio ? "audio" : "document",
    file_size: (message as any).file_size || 0,
  } : undefined)

  // ERP Card — rendered outside the bubble, full-width-ish
  if (isErpCard) {
    return (
      <div className={cn("flex w-full mb-1", isOwn ? "justify-end" : "justify-start")}>
        <div className={cn("max-w-[85%] flex flex-col", isOwn ? "items-end" : "items-start", isTemp && "opacity-60")}>
          {!isOwn && (
            <span className="text-xs font-semibold text-muted-foreground mb-0.5 px-1">
              {message.sender_name}
            </span>
          )}
          <ErpChatCard
            recordType={message.erp_record_type}
            recordId={message.erp_record_id}
            content={message.content}
          />
          {!isTemp && (
            <div className={cn("flex items-center gap-1 mt-0.5 px-1", isOwn ? "flex-row-reverse" : "flex-row")}>
              <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>{formatRelativeTime(message.created_at)}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Voice Note — inline audio player
  if (isAudio) {
    const audioSrc = effectiveAttachment?.media_url || effectiveAttachment?.file_url || mediaUrl || ""
    return (
      <div className={cn("flex w-full mb-1", isOwn ? "justify-end" : "justify-start")}>
        <div className={cn("max-w-[70%] flex flex-col", isOwn ? "items-end" : "items-start", isTemp && "opacity-60")}>
          {!isOwn && (
            <span className="text-xs font-semibold text-muted-foreground mb-0.5 px-1">{message.sender_name}</span>
          )}
          <div className={cn(
            "px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-xs",
            isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
          )}>
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 shrink-0">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <audio src={audioSrc} controls className="h-8 max-w-[210px]" style={{ accentColor: isOwn ? "white" : undefined }} />
          </div>
          {!isTemp && (
            <div className={cn("flex items-center gap-1 mt-0.5 px-1", isOwn ? "flex-row-reverse" : "flex-row")}>
              <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>{formatRelativeTime(message.created_at)}</span>
              {isOwn && <ReceiptIcon status={message.receipt} />}
            </div>
          )}
        </div>
      </div>
    )
  }

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
            !hasTextContent && isImage && "p-1"
          )}
        >
          {/* Attachment (rendered above text if both present) */}
          {effectiveAttachment && (
            <AttachmentPreview attachment={effectiveAttachment} isOwn={isOwn} />
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
            <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
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
