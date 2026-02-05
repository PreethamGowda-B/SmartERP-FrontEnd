"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { apiClient } from "@/lib/apiClient"

type Message = {
  id: number
  sender_id: number
  receiver_id: number
  message: string
  read: boolean
  created_at: string
  sender_name: string
  is_mine: boolean
}

type Owner = {
  id: number
  name: string
  email: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [owner, setOwner] = useState<Owner | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch owner info
  const fetchOwner = async () => {
    try {
      const data = await apiClient("/api/messages/owner")
      setOwner(data)
      return data
    } catch (err) {
      console.error("Error fetching owner:", err)
      return null
    }
  }

  // Fetch messages
  const fetchMessages = async (ownerId: number) => {
    try {
      const data = await apiClient(`/api/messages/conversation/${ownerId}`)
      setMessages(data)

      // Mark messages as read
      await apiClient(`/api/messages/conversation/${ownerId}/read`, {
        method: "PATCH"
      })

      setTimeout(scrollToBottom, 100)
    } catch (err) {
      console.error("Error fetching messages:", err)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !owner || sending) return

    setSending(true)
    try {
      await apiClient("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          receiver_id: owner.id,
          message: newMessage.trim()
        })
      })

      setNewMessage("")
      await fetchMessages(owner.id)
    } catch (err) {
      console.error("Error sending message:", err)
      alert("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  // Handle Enter key to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Initialize
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const ownerData = await fetchOwner()
      if (ownerData) {
        await fetchMessages(ownerData.id)
      }
      setLoading(false)
    }

    init()
  }, [])

  // Set up polling for real-time updates
  useEffect(() => {
    if (!owner) return

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(owner.id)
    }, 5000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [owner])

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`

    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="p-6 flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Chat with {owner?.name || "Owner"}
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="h-[calc(100vh-240px)] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{owner?.name?.charAt(0).toUpperCase() || "O"}</AvatarFallback>
              </Avatar>
              {owner?.name || "Owner"}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-40" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start a conversation with {owner?.name || "the owner"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[70%] ${message.is_mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                      <p
                        className={`text-xs mt-1 ${message.is_mine ? "opacity-70" : "text-muted-foreground"
                          }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                disabled={sending}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </EmployeeLayout>
  )
}
