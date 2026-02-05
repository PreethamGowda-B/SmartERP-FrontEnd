"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send, Search, Loader2, Users } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
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

type Conversation = {
    user_id: number
    user_name: string
    user_email: string
    last_message: string
    last_message_time: string
    unread_count: number
    is_last_message_mine: boolean
}

export default function OwnerMessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            const data = await apiClient("/api/messages/conversations")
            setConversations(data)
        } catch (err) {
            console.error("Error fetching conversations:", err)
        }
    }

    // Fetch messages for a conversation
    const fetchMessages = async (userId: number) => {
        try {
            const data = await apiClient(`/api/messages/conversation/${userId}`)
            setMessages(data)

            // Mark messages as read
            await apiClient(`/api/messages/conversation/${userId}/read`, {
                method: "PATCH"
            })

            // Refresh conversations to update unread count
            await fetchConversations()

            setTimeout(scrollToBottom, 100)
        } catch (err) {
            console.error("Error fetching messages:", err)
        }
    }

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedUserId || sending) return

        setSending(true)
        try {
            await apiClient("/api/messages", {
                method: "POST",
                body: JSON.stringify({
                    receiver_id: selectedUserId,
                    message: newMessage.trim()
                })
            })

            setNewMessage("")
            await fetchMessages(selectedUserId)
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

    // Select conversation
    const handleSelectConversation = async (userId: number) => {
        setSelectedUserId(userId)
        await fetchMessages(userId)
    }

    // Initialize
    useEffect(() => {
        const init = async () => {
            setLoading(true)
            await fetchConversations()
            setLoading(false)
        }

        init()
    }, [])

    // Set up polling for real-time updates
    useEffect(() => {
        // Poll every 5 seconds
        pollingIntervalRef.current = setInterval(async () => {
            await fetchConversations()
            if (selectedUserId) {
                await fetchMessages(selectedUserId)
            }
        }, 5000)

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
            }
        }
    }, [selectedUserId])

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

    // Filter conversations
    const filteredConversations = conversations.filter((conv) =>
        conv.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedConversation = conversations.find(c => c.user_id === selectedUserId)

    if (loading) {
        return (
            <OwnerLayout>
                <div className="p-6 flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </OwnerLayout>
        )
    }

    return (
        <OwnerLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Messages</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Chat with your employees
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Conversations List */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                            {filteredConversations.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                                        <p className="text-sm text-muted-foreground">
                                            {searchTerm ? "No conversations found" : "No messages yet"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredConversations.map((conversation) => (
                                    <Card
                                        key={conversation.user_id}
                                        className={`cursor-pointer transition-colors hover:bg-accent ${selectedUserId === conversation.user_id ? "border-primary bg-accent" : ""
                                            } ${conversation.unread_count > 0 ? "border-primary/50" : ""}`}
                                        onClick={() => handleSelectConversation(conversation.user_id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>
                                                        {conversation.user_name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-medium truncate">
                                                            {conversation.user_name}
                                                        </p>
                                                        {conversation.unread_count > 0 && (
                                                            <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1">
                                                                {conversation.unread_count}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {conversation.is_last_message_mine && "You: "}
                                                        {conversation.last_message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatTime(conversation.last_message_time)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-2">
                        {selectedUserId ? (
                            <Card className="h-[calc(100vh-240px)] flex flex-col">
                                <CardHeader className="border-b">
                                    <CardTitle className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>
                                                {selectedConversation?.user_name.charAt(0).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p>{selectedConversation?.user_name || "User"}</p>
                                            <p className="text-xs font-normal text-muted-foreground">
                                                {selectedConversation?.user_email}
                                            </p>
                                        </div>
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="flex-1 p-4 overflow-y-auto">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                            <MessageSquare className="h-12 w-12 mb-4 opacity-40" />
                                            <p className="text-lg font-medium">No messages yet</p>
                                            <p className="text-sm">Start a conversation</p>
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
                                                        <p className="text-sm whitespace-pre-wrap break-words">
                                                            {message.message}
                                                        </p>
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
                        ) : (
                            <Card className="h-[calc(100vh-240px)] flex items-center justify-center">
                                <CardContent className="text-center">
                                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
                                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Choose a conversation from the list to start messaging
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </OwnerLayout>
    )
}
