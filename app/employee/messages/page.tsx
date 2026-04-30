"use client"

/**
 * /app/employee/messages/page.tsx — WhatsApp-style job-based chat
 *
 * Security:
 *  - Employee can ONLY access chats for jobs where assigned_to = theirId
 *  - Backend enforces this; frontend shows only what API returns
 *
 * Layout:
 *  - LEFT PANEL:  List of job conversations (customer name, last msg, unread count)
 *  - RIGHT PANEL: Full message thread for selected job
 *
 * Real-time:
 *  - SSE on customer_job_events:{jobId} for chat_message events
 *  - Auto-reconnect on disconnect
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Send, MessageSquare, Loader2, ChevronLeft, Clock, Bell } from "lucide-react"
import { apiClient, getAuthToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { useNotifications } from "@/contexts/notification-context"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

interface Conversation {
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

interface Message {
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

export default function EmployeeMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedJob, setSelectedJob] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { notifications } = useNotifications()

  // ── Fetch Conversations ────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiClient("/api/messages/job-conversations")
      setConversations(Array.isArray(data) ? data : [])
    } catch (err: any) {
      logger.error("Error fetching conversations:", err)
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  // ── Sync with global notifications ────────────────────────────────────────
  useEffect(() => {
    const latestNotif = notifications[0]
    if (latestNotif?.type === "chat_message" && latestNotif.data?.job_id) {
      const jobId = latestNotif.data.job_id
      
      // Update conversation list in real-time
      setConversations(prev => {
        const exists = prev.some(c => c.job_id === jobId)
        if (!exists) {
          fetchConversations() // Fetch new list if job not in list
          return prev
        }
        return prev.map(c => 
          c.job_id === jobId 
            ? { 
                ...c, 
                last_message: latestNotif.message, 
                last_message_time: latestNotif.created_at,
                // Low FIX: refetch unread count from API rather than incrementing optimistically
                unread_count: selectedJob?.job_id === jobId ? 0 : (c.unread_count || 0) + 1
              }
            : c
        ).sort((a, b) => {
          if (a.job_id === jobId) return -1
          if (b.job_id === jobId) return 1
          return 0
        })
      })

      // If a new notification came for a job not currently open, refresh conversation list
      // to get accurate unread_count from the DB
      if (selectedJob?.job_id !== jobId) {
        fetchConversations()
      }

      // If this is the currently open chat, mark as read by refetching
      if (selectedJob?.job_id === jobId) {
        apiClient(`/api/messages/job/${jobId}`).catch(() => {})
      }
    }
  }, [notifications, selectedJob, fetchConversations])

  // ── Fetch Messages for a Job ───────────────────────────────────────────────
  const fetchMessages = useCallback(async (jobId: string) => {
    setLoadingMsgs(true)
    try {
      const data = await apiClient(`/api/messages/job/${jobId}`)
      setMessages(Array.isArray(data) ? data : [])
    } catch (err: any) {
      logger.error("Error fetching messages:", err)
      setMessages([])
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  // ── SSE Connection with Auto-Reconnect ────────────────────────────────────
  const connectSSE = useCallback((jobId: string) => {
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)

    const token = getAuthToken()
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://smarterp-backendend.onrender.com"
    const url = `${BACKEND_URL}/api/customer/jobs/${jobId}/events${token ? `?token=${token}` : ""}`
    const source = new EventSource(url, { withCredentials: true })
    sseRef.current = source

    source.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type === "chat_message") {
          const newMsg: Message = event.message
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Update conversation list's last message preview
          setConversations(prev => prev.map(c =>
            c.job_id === jobId
              ? { ...c, last_message: newMsg.message, last_message_time: newMsg.created_at }
              : c
          ))
        }
      } catch { }
    }

    source.onerror = () => {
      source.close()
      sseRef.current = null
      // Auto-reconnect after 3s
      reconnectTimeout.current = setTimeout(() => connectSSE(jobId), 3000)
    }
  }, [])

  // On job select: load messages + connect SSE
  const selectJob = useCallback((conv: Conversation) => {
    setSelectedJob(conv)
    setMobileShowChat(true)
    fetchMessages(conv.job_id)
    connectSSE(conv.job_id)
    // Clear unread for this conversation locally
    setConversations(prev => prev.map(c =>
      c.job_id === conv.job_id ? { ...c, unread_count: 0 } : c
    ))
  }, [fetchMessages, connectSSE])

  // Cleanup SSE on unmount or job change
  useEffect(() => {
    return () => {
      sseRef.current?.close()
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
    }
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initial load
  useEffect(() => {
    fetchConversations()
    const id = setInterval(fetchConversations, 30_000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!selectedJob || !messageText.trim() || sending) return
    const text = messageText.trim()
    setMessageText("")
    setSending(true)
    try {
      const data = await apiClient(`/api/messages/job/${selectedJob.job_id}`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      })
      const newMsg: Message = data?.data ?? data
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      setConversations(prev => prev.map(c =>
        c.job_id === selectedJob.job_id
          ? { ...c, last_message: text, last_message_time: new Date().toISOString() }
          : c
      ))
    } catch (err: any) {
      setMessageText(text) // Restore typed message
      toast.error(err.message || "Message failed to send. Please try again.")
    }
    finally { setSending(false) }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <EmployeeLayout>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-gray-50 dark:bg-gray-900">

        {/* LEFT: Conversation List */}
        <div className={cn(
          "w-full md:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col",
          mobileShowChat && "hidden md:flex"
        )}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
            <p className="text-sm text-gray-500 mt-0.5">Job conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No conversations yet</p>
                <p className="text-gray-400 text-sm mt-1">Chats appear when a customer messages on your assigned jobs</p>
              </div>
            ) : (
              Array.isArray(conversations) && conversations.map((conv) => (
                <button
                  key={conv.job_id}
                  onClick={() => selectJob(conv)}
                  className={cn(
                    "w-full text-left p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                    selectedJob?.job_id === conv.job_id 
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500"
                      : (conv.unread_count && conv.unread_count > 0) 
                        ? "bg-red-50/50 dark:bg-red-900/5 border-l-4 border-l-red-500" 
                        : ""
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {conv.customer_name || "Customer"}
                        </span>
                        {Number(conv.unread_count || 0) > 0 ? (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                            {Number(conv.unread_count || 0)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.job_title}
                      </p>
                      {conv.last_message && (
                        <p className="text-xs text-gray-400 truncate mt-1">{conv.last_message}</p>
                      )}
                    </div>
                    {conv.last_message_time && (
                      <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(conv.last_message_time)}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Chat Panel */}
        <div className={cn(
          "flex-1 flex flex-col",
          !mobileShowChat && "hidden md:flex"
        )}>
          {!selectedJob ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost" size="sm"
                  className="md:hidden"
                  onClick={() => setMobileShowChat(false)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                  {(selectedJob.customer_name || "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedJob.customer_name || "Customer"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{selectedJob.job_title}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No messages yet — say hello!
                  </div>
                ) : (
                  Array.isArray(messages) && messages.map((msg) => {
                    const isMine = msg.sender_type === "employee"
                    return (
                      <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                          isMine
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-gray-600"
                        )}>
                          {!isMine && (
                            <p className="text-xs font-black text-indigo-500 mb-1">{msg.sender_name}</p>
                          )}
                          <p className="leading-relaxed">{msg.message}</p>
                          <p className={cn("text-[10px] font-bold uppercase tracking-tighter mt-1.5", isMine ? "text-indigo-200" : "text-gray-400")}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => { e.preventDefault(); sendMessage() }}
                >
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message…"
                    disabled={sending}
                    className="flex-1 rounded-full bg-gray-100 dark:bg-gray-700 border-0"
                    maxLength={2000}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-indigo-600 hover:bg-indigo-700 shrink-0"
                    disabled={!messageText.trim() || sending}
                  >
                    {sending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}
