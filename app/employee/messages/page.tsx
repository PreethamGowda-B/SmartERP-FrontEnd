"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send, Search, Bot, Loader2 } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { useChat } from "@/contexts/chat-context"
import { useAuth } from "@/contexts/auth-context"

export default function MessagesPage() {
  const { messages, addMessage, isLoading } = useChat()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const conversations = Array.from(new Map(messages.map((msg) => [msg.conversationId || msg.sender, msg])).values())

  const filteredConversations = conversations.filter((msg) =>
    msg.sender.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const selectedMessages = selectedConversation
    ? messages.filter((msg) => (msg.conversationId || msg.sender) === selectedConversation)
    : []

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setIsSending(true)
    try {
      const message = {
        id: Date.now().toString(),
        sender: user?.name || "You",
        senderId: user?.id,
        role: user?.role || "employee",
        message: newMessage,
        time: new Date().toISOString(),
        unread: false,
        conversationId: selectedConversation,
      }

      await addMessage(message)
      setNewMessage("")
    } catch (err) {
      console.error("Failed to send message:", err)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Syncing your workspace…</p>
          </div>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Messages</h1>
          <Button>
            <MessageSquare className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {filteredConversations.map((message) => (
                <Card
                  key={message.conversationId || message.sender}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    (message.conversationId || message.sender) === selectedConversation
                      ? "border-primary bg-primary/5"
                      : ""
                  } ${message.unread ? "border-primary" : ""}`}
                  onClick={() => setSelectedConversation(message.conversationId || message.sender)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.sender === "AI Assistant" ? <Bot className="h-4 w-4" /> : message.sender.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{message.sender}</p>
                          <Badge variant="secondary" className="text-xs">
                            {message.role}
                          </Badge>
                          {message.unread && <div className="w-2 h-2 bg-primary rounded-full" />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{message.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(message.time).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{selectedConversation.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {selectedConversation}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {selectedMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 max-w-xs ${
                            msg.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p
                            className={`text-xs ${msg.senderId === user?.id ? "opacity-70" : "text-muted-foreground"} mt-1`}
                          >
                            {new Date(msg.time).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[40px] max-h-[120px]"
                    />
                    <Button size="icon" onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}
