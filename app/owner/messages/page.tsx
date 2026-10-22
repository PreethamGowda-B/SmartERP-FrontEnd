"use client"
import { getApiOrigin } from "@/lib/api-environment.mjs";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Send, MessageSquare, Loader2, ChevronLeft, Clock, Users } from "lucide-react"
import { apiClient, getAuthToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { useNotifications } from "@/contexts/notification-context"
import { toast } from "sonner"
import { MessagingProvider, useMessagingContext } from "@/contexts/messaging-context"
import { MessagingLayout } from "@/components/messaging/MessagingLayout"
import { ConversationList } from "@/components/messaging/ConversationList"
import { ChatArea } from "@/components/messaging/ChatArea"

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobConversation {
  job_id: string
  job_title: string
  job_status: string
  customer_name: string
  customer_email: string
  last_message: string | null
  last_message_time: string | null
  total_messages: number
  unread_count?: number
}

interface JobMessage {
  id: string
  job_id?: string
  sender_type: "customer" | "employee"
  sender_id: string
  sender_name: string
  message: string
  media_url?: string | null
  media_type?: string | null
  file_name?: string | null
  created_at: string
}

function formatTime(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return formatTime(iso)
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

// ─── Job Conversations Tab ───────────────────────────────────────────────────

function JobMessagesTab() {
  const [conversations, setConversations] = useState<JobConversation[]>([])
  const [selectedJob, setSelectedJob] = useState<JobConversation | null>(null)
  const [messages, setMessages] = useState<JobMessage[]>([])
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { notifications } = useNotifications()

  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiClient("/api/messages/job-conversations")
      setConversations(Array.isArray(data) ? data : [])
    } catch (err: any) {
      logger.error("Error fetching job conversations:", err)
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  const latestNotif = notifications[0]
  const latestNotifType = latestNotif?.type
  const latestNotifJobId = latestNotif?.data?.job_id
  const latestNotifMessage = latestNotif?.message
  const latestNotifCreatedAt = latestNotif?.created_at
  const selectedJobId = selectedJob?.job_id

  useEffect(() => {
    if (latestNotifType === "chat_message" && latestNotifJobId) {
      setConversations(prev => {
        const exists = prev.some(c => c.job_id === latestNotifJobId)
        if (!exists) { fetchConversations(); return prev }
        return prev.map(c =>
          c.job_id === latestNotifJobId
            ? { ...c, last_message: latestNotifMessage, last_message_time: latestNotifCreatedAt,
                unread_count: selectedJobId === latestNotifJobId ? 0 : (c.unread_count || 0) + 1 }
            : c
        ).sort((a, b) => (a.job_id === latestNotifJobId ? -1 : b.job_id === latestNotifJobId ? 1 : 0))
      })
      if (selectedJobId !== latestNotifJobId) fetchConversations()
      if (selectedJobId === latestNotifJobId) apiClient(`/api/messages/job/${latestNotifJobId}`).catch(() => {})
    }
  }, [latestNotifType, latestNotifJobId, latestNotifMessage, latestNotifCreatedAt, selectedJobId, fetchConversations])

  const fetchMessages = useCallback(async (jobId: string) => {
    setLoadingMsgs(true)
    try {
      const data = await apiClient(`/api/messages/job/${jobId}`)
      setMessages(Array.isArray(data) ? data : [])
    } catch (err: any) {
      logger.error("Error fetching job messages:", err)
      setMessages([])
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  const connectSSE = useCallback((jobId: string) => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null }
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
    const token = getAuthToken()
    if (!token) return

    const BACKEND_URL = getApiOrigin()
    const url = `${BACKEND_URL}/api/customer/jobs/${jobId}/events${token ? `?token=${token}` : ""}`
    const source = new EventSource(url, { withCredentials: true })
    sseRef.current = source
    source.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type === "chat_message") {
          const newMsg: JobMessage = event.message
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
          setConversations(prev => prev.map(c =>
            c.job_id === jobId ? { ...c, last_message: newMsg.message, last_message_time: newMsg.created_at } : c
          ))
        }
      } catch { }
    }
    source.onerror = () => {
      source.close(); sseRef.current = null
    }
  }, [])

  const selectJob = useCallback((conv: JobConversation) => {
    setSelectedJob(conv)
    setMobileShowChat(true)
    fetchMessages(conv.job_id)
    connectSSE(conv.job_id)
    setConversations(prev => prev.map(c => c.job_id === conv.job_id ? { ...c, unread_count: 0 } : c))
  }, [fetchMessages, connectSSE])

  const lastMessageId = messages[messages.length - 1]?.id
  const messagesCount = messages.length
  useEffect(() => () => { sseRef.current?.close(); if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current) }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messagesCount, lastMessageId])
  useEffect(() => { fetchConversations(); const id = setInterval(fetchConversations, 30_000); return () => clearInterval(id) }, [fetchConversations])

  const sendMessage = async () => {
    if (!selectedJob || !messageText.trim() || sending) return
    const text = messageText.trim()
    setMessageText("")
    setSending(true)
    try {
      const data = await apiClient(`/api/messages/job/${selectedJob.job_id}`, {
        method: "POST", body: JSON.stringify({ message: text }),
      })
      const newMsg: JobMessage = data?.data ?? data
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
      setConversations(prev => prev.map(c =>
        c.job_id === selectedJob.job_id ? { ...c, last_message: text, last_message_time: new Date().toISOString() } : c
      ))
    } catch (err: any) {
      setMessageText(text)
      toast.error(err.message || "Message failed to send.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-full w-full min-h-0 flex overflow-hidden bg-background">
      {/* Left */}
      <div className={cn("w-full md:w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col", mobileShowChat && "hidden md:flex")}>
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">Customer Job Chats</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Chats with customers on jobs</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium text-sm">No conversations yet</p>
            </div>
          ) : conversations.map((conv) => (
            <button key={conv.job_id} onClick={() => selectJob(conv)} className={cn(
              "w-full text-left p-3.5 px-4 border-b border-slate-100 hover:bg-slate-50 transition-colors",
              selectedJob?.job_id === conv.job_id ? "bg-primary/5 border-l-2 border-l-primary"
                : (conv.unread_count && conv.unread_count > 0) ? "bg-amber-50/50 border-l-2 border-l-amber-500" : ""
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">{conv.customer_name || "Customer"}</span>
                    {Number(conv.unread_count || 0) > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">{conv.unread_count}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.job_title}</p>
                  {conv.last_message && <p className="text-xs text-slate-400 truncate mt-1">{conv.last_message}</p>}
                </div>
                {conv.last_message_time && (
                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(conv.last_message_time)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className={cn("flex-1 flex flex-col bg-white", !mobileShowChat && "hidden md:flex")}>
        {!selectedJob ? (
          <div className="flex-1 flex items-center justify-center text-center p-8 bg-slate-50/50">
            <div><MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-muted-foreground font-medium text-sm">Select a conversation</p></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 border-b bg-slate-50/70 border-slate-200">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileShowChat(false)}><ChevronLeft className="w-4 h-4" /></Button>
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">{(selectedJob.customer_name || "C").charAt(0).toUpperCase()}</div>
              <div><p className="font-semibold text-sm text-slate-900">{selectedJob.customer_name || "Customer"}</p><p className="text-xs text-muted-foreground truncate">{selectedJob.job_title}</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {loadingMsgs ? <div className="flex justify-center pt-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                : messages.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No messages yet — start the conversation!</div>
                : messages.map((msg) => {
                  const isMine = msg.sender_type === "employee"
                  return (
                    <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-xs", isMine ? "bg-primary text-primary-foreground rounded-tr-xs" : "bg-slate-100 text-slate-900 rounded-tl-xs border border-slate-200/80")}>
                        {!isMine && <p className="text-xs font-semibold text-primary mb-1">{msg.sender_name}</p>}
                        <p className="leading-relaxed">{msg.message}</p>
                        {msg.media_url && msg.media_type === "image" && <a href={msg.media_url} target="_blank" rel="noreferrer"><img src={msg.media_url} alt={msg.file_name || "Chat attachment"} className="mt-2 max-h-48 rounded-lg object-contain" /></a>}
                        {msg.media_url && msg.media_type !== "image" && <a href={msg.media_url} target="_blank" rel="noreferrer" className="mt-2 block underline text-xs">📎 {msg.file_name || "Open attachment"}</a>}
                        <p className={cn("text-[10px] mt-1.5", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/60">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage() }}>
                <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message…" disabled={sending} className="flex-1 rounded-xl bg-white border border-slate-200 text-sm shadow-xs" maxLength={2000} />
                <Button type="submit" size="icon" className="rounded-xl shadow-xs shrink-0" disabled={!messageText.trim() || sending} title="Send Message">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Internal Messages Tab ───────────────────────────────────────────────────

function InternalMessagesTab() {
  const {
    contacts,
    conversations,
    activeConversationId,
    messages,
    hasMore,
    loadingMessages,
    loadingConversations,
    searchQuery,
    sending,
    typingUsers,
    actions,
  } = useMessagingContext()

  const [mobileShowChat, setMobileShowChat] = useState(false)

  // Find the active conversation's other user info
  const activeConv = useMemo(
    () => conversations.find(c => c.conversation_id === activeConversationId),
    [conversations, activeConversationId]
  )

  // If no active conv yet but we have a contact match
  const activeContact = useMemo(() => {
    if (activeConv) return null
    return contacts.find(c => {
      const conv = conversations.find(cv => cv.other_user_id === c.user_id)
      return conv?.conversation_id === activeConversationId
    })
  }, [activeConv, contacts, conversations, activeConversationId])

  const otherUserName = activeConv?.other_user_name ?? activeContact?.name ?? ""
  const otherUserRole = activeConv?.other_user_role ?? activeContact?.role ?? "employee"
  const otherUserOnline = activeConv?.other_user_online ?? activeContact?.online_status ?? false

  const handleSelect = async (userId: string, conversationId?: string | null) => {
    await actions.openConversation(userId, conversationId)
    setMobileShowChat(true)
  }

  const handleBack = () => setMobileShowChat(false)

  return (
    <MessagingLayout
      showChat={mobileShowChat}
      leftPanel={
        <ConversationList
          contacts={contacts}
          conversations={conversations}
          activeConversationId={activeConversationId}
          searchQuery={searchQuery}
          onSearchChange={actions.setSearchQuery}
          onSelect={handleSelect}
          loading={loadingConversations}
        />
      }
      rightPanel={
        <ChatArea
          conversationId={activeConversationId}
          otherUserName={otherUserName}
          otherUserRole={otherUserRole}
          otherUserOnline={otherUserOnline}
          messages={messages}
          hasMore={hasMore}
          loadingMessages={loadingMessages}
          sending={sending}
          typingUsers={typingUsers}
          onSend={actions.sendMessage}
          onLoadMore={actions.loadMoreMessages}
          onTyping={actions.sendTyping}
          onBack={handleBack}
        />
      }
    />
  )
}

// ─── System Alerts & Notifications Tab ────────────────────────────────────────

function NotificationsTab() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications()
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-foreground">System Alerts & Workflow Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full font-bold">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={() => markAllAsRead()} disabled={unreadCount === 0} className="h-8 text-xs">
          Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              "p-4 rounded-xl border transition-all flex items-start gap-3",
              !n.read ? "bg-primary/5 border-primary/40" : "bg-card border-border/60"
            )}
          >
            <div className="p-2 rounded-lg bg-muted text-foreground shrink-0 mt-0.5">
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
              <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
            {!n.read && (
              <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)} className="h-7 text-xs">
                Mark read
              </Button>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-12 text-center text-xs font-bold text-muted-foreground">
            No system notifications recorded.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function OwnerMessagesPageContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get("tab")
  const initialTab = tabParam === "notifications" ? "notifications" : tabParam === "jobs" ? "jobs" : "internal"
  const [activeTab, setActiveTab] = useState<"internal" | "jobs" | "notifications">(initialTab)

  useEffect(() => {
    if (tabParam === "notifications") setActiveTab("notifications")
    else if (tabParam === "jobs") setActiveTab("jobs")
    else if (tabParam === "internal") setActiveTab("internal")
  }, [tabParam])

  return (
    <OwnerLayout noPadding>
      <MessagingProvider>
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b bg-background shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("internal")}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors shrink-0",
                activeTab === "internal"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              Team Chat
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors shrink-0",
                activeTab === "jobs"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              Customer Jobs
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors shrink-0",
                activeTab === "notifications"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-4 w-4" />
              System Alerts & Notifications
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === "internal" ? (
              <InternalMessagesTab />
            ) : activeTab === "jobs" ? (
              <JobMessagesTab />
            ) : (
              <NotificationsTab />
            )}
          </div>
        </div>
      </MessagingProvider>
    </OwnerLayout>
  )
}

export default function OwnerMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-muted-foreground">Loading messaging hub...</div>}>
      <OwnerMessagesPageContent />
    </Suspense>
  )
}
