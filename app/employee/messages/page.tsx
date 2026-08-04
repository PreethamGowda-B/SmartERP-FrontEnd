"use client"

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { EmployeeLayout } from "@/components/employee-layout"
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

  useEffect(() => {
    const latestNotif = notifications[0]
    if (latestNotif?.type === "chat_message" && latestNotif.data?.job_id) {
      const jobId = latestNotif.data.job_id
      setConversations(prev => {
        const exists = prev.some(c => c.job_id === jobId)
        if (!exists) { fetchConversations(); return prev }
        return prev.map(c =>
          c.job_id === jobId
            ? { ...c, last_message: latestNotif.message, last_message_time: latestNotif.created_at,
                unread_count: selectedJob?.job_id === jobId ? 0 : (c.unread_count || 0) + 1 }
            : c
        ).sort((a, b) => (a.job_id === jobId ? -1 : b.job_id === jobId ? 1 : 0))
      })
      if (selectedJob?.job_id !== jobId) fetchConversations()
      if (selectedJob?.job_id === jobId) apiClient(`/api/messages/job/${jobId}`).catch(() => {})
    }
  }, [notifications[0]?.type, notifications[0]?.data?.job_id, notifications[0]?.message, notifications[0]?.created_at, selectedJob?.job_id, fetchConversations])

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

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.prozync.in"
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
      // Do not infinitely reconnect if server drops or returns auth error
    }
  }, [])

  const selectJob = useCallback((conv: JobConversation) => {
    setSelectedJob(conv)
    setMobileShowChat(true)
    fetchMessages(conv.job_id)
    connectSSE(conv.job_id)
    setConversations(prev => prev.map(c => c.job_id === conv.job_id ? { ...c, unread_count: 0 } : c))
  }, [fetchMessages, connectSSE])

  useEffect(() => () => { sseRef.current?.close(); if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current) }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages.length, messages[messages.length - 1]?.id])
  useEffect(() => { fetchConversations(); const id = setInterval(fetchConversations, 30_000); return () => clearInterval(id) }, []) // eslint-disable-line

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
    <div className="h-full flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Left */}
      <div className={cn("w-full md:w-80 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col", mobileShowChat && "hidden md:flex")}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Customer Job Chats</h2>
          <p className="text-xs text-gray-500 mt-0.5">Chats with customers on your jobs</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">No conversations yet</p>
            </div>
          ) : conversations.map((conv) => (
            <button key={conv.job_id} onClick={() => selectJob(conv)} className={cn(
              "w-full text-left p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
              selectedJob?.job_id === conv.job_id ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500"
                : (conv.unread_count && conv.unread_count > 0) ? "bg-red-50/50 dark:bg-red-900/5 border-l-4 border-l-red-500" : ""
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{conv.customer_name || "Customer"}</span>
                    {Number(conv.unread_count || 0) > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center animate-pulse">{conv.unread_count}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.job_title}</p>
                  {conv.last_message && <p className="text-xs text-gray-400 truncate mt-1">{conv.last_message}</p>}
                </div>
                {conv.last_message_time && (
                  <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(conv.last_message_time)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className={cn("flex-1 flex flex-col", !mobileShowChat && "hidden md:flex")}>
        {!selectedJob ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div><MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" /><p className="text-gray-500 font-medium text-sm">Select a conversation</p></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileShowChat(false)}><ChevronLeft className="w-4 h-4" /></Button>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">{(selectedJob.customer_name || "C").charAt(0).toUpperCase()}</div>
              <div><p className="font-semibold text-gray-900 dark:text-white">{selectedJob.customer_name || "Customer"}</p><p className="text-xs text-gray-500 truncate">{selectedJob.job_title}</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {loadingMsgs ? <div className="flex justify-center pt-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                : messages.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">No messages yet — say hello!</div>
                : messages.map((msg) => {
                  const isMine = msg.sender_type === "employee"
                  return (
                    <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", isMine ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-gray-600")}>
                        {!isMine && <p className="text-xs font-black text-indigo-500 mb-1">{msg.sender_name}</p>}
                        <p className="leading-relaxed">{msg.message}</p>
                        <p className={cn("text-[10px] font-bold uppercase tracking-tighter mt-1.5", isMine ? "text-indigo-200" : "text-gray-400")}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage() }}>
                <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message…" disabled={sending} className="flex-1 rounded-full bg-gray-100 dark:bg-gray-700 border-0" maxLength={2000} />
                <Button type="submit" size="icon" className="rounded-full bg-indigo-600 hover:bg-indigo-700 shrink-0" disabled={!messageText.trim() || sending}>
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
    contacts, conversations, activeConversationId,
    messages, hasMore, loadingMessages, loadingConversations,
    searchQuery, sending, typingUsers, actions,
  } = useMessagingContext()

  const [mobileShowChat, setMobileShowChat] = useState(false)

  const activeConv = useMemo(() => conversations.find(c => c.conversation_id === activeConversationId), [conversations, activeConversationId])
  const otherUserName = activeConv?.other_user_name ?? ""
  const otherUserRole = activeConv?.other_user_role ?? "employee"
  const otherUserOnline = activeConv?.other_user_online ?? false

  const handleSelect = async (userId: string) => {
    await actions.openConversation(userId)
    setMobileShowChat(true)
  }

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
          onBack={() => setMobileShowChat(false)}
        />
      }
    />
  )
}

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

function EmployeeMessagesPageContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams?.get("tab") === "notifications" ? "notifications" : "internal"
  const [activeTab, setActiveTab] = useState<"internal" | "jobs" | "notifications">(initialTab as any)

  return (
    <EmployeeLayout>
      <MessagingProvider>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Tab bar */}
          <div className="flex border-b bg-background shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("internal")}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
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
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
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
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
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
          <div className="flex-1 overflow-hidden">
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
    </EmployeeLayout>
  )
}

export default function EmployeeMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-muted-foreground">Loading messaging hub...</div>}>
      <EmployeeMessagesPageContent />
    </Suspense>
  )
}
