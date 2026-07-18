"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, MessageSquare } from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"
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
  onSend: (content: string) => Promise<void>
  onLoadMore: () => Promise<void>
  onBack?: () => void
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
  onSend,
  onLoadMore,
  onBack,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

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
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {/* Load more */}
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

        {/* Message list */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.is_mine} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={onSend} disabled={sending} />
    </div>
  )
}
