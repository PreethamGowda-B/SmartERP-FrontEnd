"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Loader2, RefreshCw, User, Briefcase, ChevronLeft } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { apiClient } from "@/lib/apiClient"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────
type OwnerMessage = {
  id: number
  sender_id: string
  receiver_id: string
  message: string
  read: boolean
  created_at: string
  sender_name: string
  is_mine: boolean
}

type JobMessage = {
  id: string
  sender_type: 'customer' | 'employee'
  sender_id: string
  sender_name: string
  message: string
  created_at: string
}

type JobConversation = {
  job_id: string
  job_title: string
  job_status: string
  customer_id: string
  customer_name: string
  customer_email: string
  last_message: string | null
  last_message_time: string | null
  total_messages: number
}

type Owner = { id: string; name: string; email: string }

type ChatType = 'owner' | 'job'
type SelectedChat = { type: 'owner'; owner: Owner } | { type: 'job'; conv: JobConversation }

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diff < 1) return "Just now"
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function initials(name?: string) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeeMessagesPage() {
  const [owner, setOwner] = useState<Owner | null>(null)
  const [ownerMessages, setOwnerMessages] = useState<OwnerMessage[]>([])
  const [jobConversations, setJobConversations] = useState<JobConversation[]>([])
  const [jobMessages, setJobMessages] = useState<JobMessage[]>([])
  const [selected, setSelected] = useState<SelectedChat | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  // ── Load owner + job conversations ─────────────────────────────────────────
  const loadSidebar = useCallback(async () => {
    try {
      const [ownerData, jobConvData] = await Promise.allSettled([
        apiClient("/api/messages/owner"),
        apiClient("/api/messages/job-conversations"),
      ])
      if (ownerData.status === "fulfilled") setOwner(ownerData.value)
      if (jobConvData.status === "fulfilled") setJobConversations(Array.isArray(jobConvData.value) ? jobConvData.value : [])
    } catch {}
  }, [])

  // ── Load messages for selected chat ────────────────────────────────────────
  const loadMessages = useCallback(async (chat: SelectedChat) => {
    try {
      if (chat.type === "owner") {
        const data = await apiClient(`/api/messages/conversation/${chat.owner.id}`)
        setOwnerMessages(Array.isArray(data) ? data : [])
        // Mark as read
        apiClient(`/api/messages/conversation/${chat.owner.id}/read`, { method: "PATCH" }).catch(() => {})
      } else {
        const data = await apiClient(`/api/messages/job/${chat.conv.job_id}`)
        setJobMessages(Array.isArray(data) ? data : [])
      }
      scrollToBottom()
    } catch {}
  }, [])

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true)
      await loadSidebar()
      setLoading(false)
    })()
  }, [loadSidebar])

  // ── Auto-select first conversation ─────────────────────────────────────────
  useEffect(() => {
    if (!selected && owner && !loading) {
      const chat: SelectedChat = { type: "owner", owner }
      setSelected(chat)
      loadMessages(chat)
    }
  }, [owner, loading, selected, loadMessages])

  // ── Polling ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => loadMessages(selected), 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selected, loadMessages])

  // ── Select chat ─────────────────────────────────────────────────────────────
  const selectChat = (chat: SelectedChat) => {
    setSelected(chat)
    setNewMessage("")
    loadMessages(chat)
    setMobileShowChat(true)
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !selected || sending) return
    setSending(true)
    try {
      if (selected.type === "owner") {
        await apiClient("/api/messages", {
          method: "POST",
          body: JSON.stringify({ receiver_id: selected.owner.id, message: newMessage.trim() }),
        })
      } else {
        await apiClient(`/api/messages/job/${selected.conv.job_id}`, {
          method: "POST",
          body: JSON.stringify({ message: newMessage.trim() }),
        })
      }
      setNewMessage("")
      await loadMessages(selected)
      await loadSidebar()
    } catch {
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const totalConversations = (owner ? 1 : 0) + jobConversations.length

  return (
    <EmployeeLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{totalConversations} conversation{totalConversations !== 1 ? "s" : ""}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadSidebar} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* ── Left panel: conversation list ─────────────────────────────── */}
            <div className={cn(
              "w-full sm:w-80 border-r flex flex-col shrink-0 overflow-y-auto",
              mobileShowChat && "hidden sm:flex"
            )}>
              {/* Owner chat */}
              {owner && (
                <button
                  onClick={() => selectChat({ type: "owner", owner })}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors border-b",
                    selected?.type === "owner" && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {initials(owner.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{owner.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 border-primary/30 text-primary">Owner</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {ownerMessages.length > 0
                        ? ownerMessages[ownerMessages.length - 1]?.message
                        : "Start a conversation"}
                    </p>
                  </div>
                </button>
              )}

              {/* Job chats */}
              {jobConversations.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
                    Customer Chats
                  </div>
                  {jobConversations.map(conv => (
                    <button
                      key={conv.job_id}
                      onClick={() => selectChat({ type: "job", conv })}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors border-b",
                        selected?.type === "job" && selected.conv.job_id === conv.job_id && "bg-indigo-50/50 border-l-2 border-l-indigo-500"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-indigo-700 font-semibold text-sm">{initials(conv.customer_name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm truncate">{conv.customer_name || "Customer"}</span>
                          {conv.last_message_time && (
                            <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(conv.last_message_time)}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          <span className="text-indigo-600 font-medium">{conv.job_title}</span>
                          {conv.last_message && ` · ${conv.last_message}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {totalConversations === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                  <p className="font-medium">No conversations yet</p>
                  <p className="text-xs mt-1">Messages from customers and owners will appear here</p>
                </div>
              )}
            </div>

            {/* ── Right panel: chat window ──────────────────────────────────── */}
            <div className={cn(
              "flex-1 flex flex-col overflow-hidden",
              !mobileShowChat && "hidden sm:flex"
            )}>
              {!selected ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm mt-1">Choose a chat from the left panel</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0 bg-background">
                    <button
                      className="sm:hidden p-1 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileShowChat(false)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className={cn(
                        "font-semibold text-sm",
                        selected.type === "owner" ? "bg-primary/10 text-primary" : "bg-indigo-100 text-indigo-700"
                      )}>
                        {selected.type === "owner" ? initials(selected.owner.name) : initials(selected.conv.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {selected.type === "owner" ? selected.owner.name : (selected.conv.customer_name || "Customer")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selected.type === "owner" ? "Owner" : selected.conv.job_title}
                      </p>
                    </div>
                    {selected.type === "job" && (
                      <Badge variant="outline" className={cn(
                        "text-[10px] shrink-0",
                        selected.conv.job_status === "completed" ? "border-green-300 text-green-700" : "border-indigo-300 text-indigo-700"
                      )}>
                        {selected.conv.job_status}
                      </Badge>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selected.type === "owner" ? (
                      ownerMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                          <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                          <p>No messages yet</p>
                          <p className="text-xs mt-1">Start a conversation with {owner?.name}</p>
                        </div>
                      ) : (
                        ownerMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.is_mine ? "justify-end" : "justify-start"}`}>
                            <div className={cn(
                              "rounded-2xl px-4 py-2.5 max-w-[72%]",
                              msg.is_mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                            )}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              <p className={cn("text-[10px] mt-1", msg.is_mine ? "opacity-70 text-right" : "text-muted-foreground")}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      jobMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                          <Briefcase className="h-10 w-10 mb-3 opacity-30" />
                          <p>No messages yet</p>
                          <p className="text-xs mt-1">Start chatting with the customer</p>
                        </div>
                      ) : (
                        jobMessages.map(msg => {
                          const isMine = msg.sender_type === "employee"
                          return (
                            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                              <div className={cn(
                                "rounded-2xl px-4 py-2.5 max-w-[72%]",
                                isMine ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm"
                              )}>
                                {!isMine && (
                                  <p className="text-[10px] font-semibold text-indigo-600 mb-0.5">{msg.sender_name}</p>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                <p className={cn("text-[10px] mt-1", isMine ? "text-indigo-200 text-right" : "text-gray-400")}>
                                  {formatTime(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t p-4 shrink-0 bg-background">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                        disabled={sending}
                      />
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className={selected.type === "job" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  )
}
