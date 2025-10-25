"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"

export interface ChatMessage {
  id: string
  sender: string
  senderId?: string
  role: string
  message: string
  time: string
  unread?: boolean
  conversationId?: string
}

interface ChatContextType {
  messages: ChatMessage[]
  addMessage: (message: ChatMessage) => Promise<void>
  markMessageAsRead: (id: string) => Promise<void>
  isLoading: boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, isSyncing } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smarterp-chat-messages")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [isLoading, setIsLoading] = useState(true)
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function loadMessages() {
      if (!user) return

      try {
        console.log("[v0] Fetching chat messages from backend...")
        const serverMessages = await apiClient("/api/chat", { method: "GET" })
        console.log("[v0] Successfully fetched chat messages:", serverMessages)

        if (mounted && Array.isArray(serverMessages)) {
          const normalized = serverMessages.map((msg: any) => ({
            id: msg.id?.toString?.() ?? String(msg._db_row?.id ?? msg.id ?? ""),
            sender: msg.sender ?? msg.senderName ?? "",
            senderId: msg.senderId ?? msg.sender_id ?? "",
            role: msg.role ?? msg.senderRole ?? "",
            message: msg.message ?? msg.content ?? msg.text ?? "",
            time: msg.time ?? msg.createdAt ?? new Date().toISOString(),
            unread: msg.unread ?? false,
            conversationId: msg.conversationId ?? msg.conversation_id ?? "",
            ...msg,
          }))

          try {
            const current = JSON.stringify(messages)
            const incoming = JSON.stringify(normalized)
            if (current !== incoming) {
              setMessages(normalized)
              localStorage.setItem("smarterp-chat-messages", incoming)
            }
          } catch (err) {
            setMessages(normalized)
            localStorage.setItem("smarterp-chat-messages", JSON.stringify(normalized))
          }
        }
      } catch (err) {
        console.log(
          "[v0] Backend unavailable, using local chat messages. Error:",
          err instanceof Error ? err.message : String(err),
        )
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    if (!authLoading) {
      if (!hasSyncedRef.current) {
        loadMessages()
        hasSyncedRef.current = true
      }
      intervalId = setInterval(loadMessages, 5000)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [user, authLoading])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        localStorage.setItem("smarterp-chat-messages", JSON.stringify(messages))
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [messages])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (e: StorageEvent) => {
      if (e.key === "smarterp-chat-messages") {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue)
            if (Array.isArray(parsed)) {
              setMessages(parsed)
            }
          }
        } catch (err) {
          console.warn("Failed to parse smarterp-chat-messages from storage event", err)
        }
      }
    }

    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const addMessage = async (message: ChatMessage) => {
    setMessages((prev) => [message, ...prev])

    try {
      await apiClient("/api/chat", {
        method: "POST",
        body: JSON.stringify(message),
      })
      console.log("[v0] Chat message sent to backend")
    } catch (err) {
      console.warn("Failed to persist message to server, saved locally", err)
    }
  }

  const markMessageAsRead = async (id: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, unread: false } : msg)))

    try {
      await apiClient(`/api/chat/${id}/read`, { method: "PUT" })
      console.log("[v0] Message marked as read on backend")
    } catch (err) {
      console.warn("Failed to mark message as read on server", err)
    }
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        addMessage,
        markMessageAsRead,
        isLoading: authLoading || isSyncing,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
