"use client"

import { useEffect, useRef, useMemo } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"
import { DateSeparator } from "./DateSeparator"
import { TypingIndicator } from "./TypingIndicator"
import type { Message } from "@/types/messaging"

interface ChatAreaProps {
  conversationId: string | null
  otherUserName: string
  otherUserRole: string
  otherUserOnline: boolean
  messages: Message[]
  hasMore: boolean
  loadingMessages: boolean
  sending: boolean
  typingUsers?: Record<string, { name: string; until: number }>
  onSend: (content: string, attachment?: import("@/types/messaging").MessageAttachment) => Promise<void>
  onLoadMore: () => Promise<void>
  onTyping?: (typing: boolean) => void
  onBack?: () => void
}

// Group messages by date for separator rendering
function getDateKey(iso: string): string {
  try {
    return format(new Date(iso), "yyyy-MM-dd")
  } catch {
    return ""
  }
}

export function ChatArea({
  conversationId,
  otherUserName,
  otherUserRole,
  otherUserOnline,
  messages,
  hasMore,
  loadingMessages,
  sending,
  typingUsers = {},
  onSend,
  onLoadMore,
  onTyping,
  onBack,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevMsgCountRef = useRef(0)

  // Scroll to bottom only when new messages are appended (not when loading older ones)
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevMsgCountRef.current = messages.length
  }, [messages.length])

  // Compute which messages get a date separator before them
  const messagesWithSeparators = useMemo(() => {
    const result: Array<{ type: "separator"; date: Date } | { type: "message"; message: Message }> = []
    let lastDateKey = ""
    for (const msg of messages) {
      const key = getDateKey(msg.created_at)
      if (key && key !== lastDateKey) {
        result.push({ type: "separator", date: new Date(msg.created_at) })
        lastDateKey = key
      }
      result.push({ type: "message", message: msg })
    }
    return result
  }, [messages])

  // Active typing users (only those whose "until" hasn't expired)
  const activeTypingEntries = useMemo(() => {
    const now = Date.now()
    return Object.entries(typingUsers).filter(([, info]) => info.until > now)
  }, [typingUsers])

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
        <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Select a conversation</p>
        <p className="text-sm mt-1">Choose someone from the list to start chatting</p>
      </div>
    )
  }

  const initials = otherUserName.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          {otherUserOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">{otherUserName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">
              {otherUserRole}
            </Badge>
            {otherUserOnline && (
              <span className="text-[10px] text-green-600 font-medium">Online</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center pb-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={onLoadMore}
              disabled={loadingMessages}
            >
              {loadingMessages ? "Loading…" : "Load older messages"}
            </Button>
          </div>
        )}

        {/* Skeleton for initial load */}
        {loadingMessages && messages.length === 0 && (
          <div className="space-y-3 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-36"}`} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <p className="text-sm">No messages yet — say hello!</p>
          </div>
        )}

        {/* Messages with date separators */}
        {messagesWithSeparators.map((item, idx) => {
          if (item.type === "separator") {
            return <DateSeparator key={`sep-${idx}`} date={item.date} />
          }
          return (
            <MessageBubble
              key={item.message.id}
              message={item.message}
              isOwn={item.message.is_mine}
            />
          )
        })}

        {/* Typing indicator */}
        {activeTypingEntries.map(([userId, info]) => (
          <TypingIndicator key={userId} name={info.name} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={onSend}
        onTyping={onTyping}
        disabled={sending}
      />
    </div>
  )
}
