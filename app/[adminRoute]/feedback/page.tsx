"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  User,
  Building,
  RefreshCw,
  Mail,
  AlertCircle,
  Tag,
  ChevronRight,
  X,
  ExternalLink,
  MessageCircle,
  Laptop
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface FeedbackItem {
  id: number
  user_id?: string
  user_name?: string
  user_email?: string
  company_id?: number
  company_name?: string
  type: string // bug, feature, general, support
  subject: string
  message: string
  status: string // new, open, pending, replied, resolved, closed
  admin_reply?: string
  replied_at?: string
  created_at: string
  page_url?: string
  severity?: string
}

function safeDistance(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Recently"
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  
  // Selected ticket drawer
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replying, setReplying] = useState(false)

  const fetchFeedback = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    try {
      const data = await apiClient<FeedbackItem[]>("/api/v1/feedback")
      setFeedback(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load user feedback & tickets")
      setFeedback([])
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const handleSendReply = async () => {
    if (!selectedItem || !replyText.trim()) {
      toast.error("Please enter a reply message")
      return
    }

    setReplying(true)
    try {
      await apiClient(`/api/v1/feedback/${selectedItem.id}/reply`, {
        method: "PATCH",
        body: JSON.stringify({ reply: replyText, status: "replied" })
      }).catch(async () => {
        // Fallback for general status update
        await apiClient(`/api/v1/feedback/${selectedItem.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "replied", admin_reply: replyText })
        })
      })

      setFeedback(prev => prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, status: "replied", admin_reply: replyText, replied_at: new Date().toISOString() } 
          : item
      ))
      if (selectedItem) {
        setSelectedItem({
          ...selectedItem,
          status: "replied",
          admin_reply: replyText,
          replied_at: new Date().toISOString()
        })
      }
      toast.success("Reply recorded and ticket marked replied")
      setReplyText("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to record reply")
    } finally {
      setReplying(false)
    }
  }

  const filteredItems = feedback.filter(item => {
    const matchesSearch =
      (item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.user_email?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesType = typeFilter === "all" || item.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Feedback & Support Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              User inquiries, bug submissions, feature suggestions, and administrative resolution
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFeedback(true)}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
              <span>Refresh Inbox</span>
            </Button>
          </div>
        </div>

        {/* ── Filter Toolbar ─────────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by subject, message content, or user email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-medium focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="replied">Replied</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by Category"
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="bug">Bug Reports</option>
              <option value="feature">Feature Requests</option>
              <option value="support">Support Inquiries</option>
              <option value="general">General Feedback</option>
            </select>
          </div>
        </div>

        {/* ── Ticket List Table ──────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-6">Subject & Message</th>
                  <th className="py-3.5">Category</th>
                  <th className="py-3.5">Submitter</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Submitted</th>
                  <th className="py-3.5 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 pl-6"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="py-4 pr-6 text-right"><div className="h-4 w-14 bg-slate-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No support tickets found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 pl-6 max-w-sm min-w-0">
                        <span className="font-bold text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                          {item.subject || "No Subject"}
                        </span>
                        <span className="text-slate-500 line-clamp-1 text-[11px] mt-0.5">
                          {item.message}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold uppercase">
                          {item.type || "general"}
                        </Badge>
                      </td>

                      <td className="py-3.5">
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 block truncate">
                            {item.user_name || "User"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono truncate block">
                            {item.user_email || "Anonymous"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <Badge className={
                          item.status === 'replied' || item.status === 'resolved'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                            : "bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold"
                        }>
                          {item.status === 'replied' ? "Replied" : item.status === 'resolved' ? "Resolved" : "Open"}
                        </Badge>
                      </td>

                      <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                        {safeDistance(item.created_at)}
                      </td>

                      <td className="py-3.5 pr-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedItem(item)
                          }}
                          className="h-8 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                        >
                          Details
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Slide-Over Ticket Drawer ────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex justify-end font-sans">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
                className="relative z-50 w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-slate-200"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-900 truncate">
                        {selectedItem.subject || "Support Inquiry"}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold uppercase">
                          {selectedItem.type || "General"}
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-400">
                          {safeDistance(selectedItem.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedItem(null)}
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 text-xs">
                  {/* Submitter Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Submitted By</span>
                    <p className="text-sm font-bold text-slate-900">{selectedItem.user_name || "User"}</p>
                    <p className="text-slate-500 font-mono">{selectedItem.user_email || "No email provided"}</p>
                    {selectedItem.page_url && (
                      <p className="text-slate-400 font-mono text-[11px] pt-1 truncate">
                        URL: {selectedItem.page_url}
                      </p>
                    )}
                  </div>

                  {/* Message Box */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-700 uppercase text-[10px]">User Inquiry / Feedback</span>
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                      {selectedItem.message}
                    </div>
                  </div>

                  {/* Existing Reply if any */}
                  {selectedItem.admin_reply && (
                    <div className="space-y-1.5">
                      <span className="font-bold text-emerald-700 uppercase text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Previous Admin Reply
                      </span>
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-emerald-950 whitespace-pre-wrap">
                        {selectedItem.admin_reply}
                        {selectedItem.replied_at && (
                          <span className="block text-[10px] text-emerald-600 font-mono mt-2">
                            Replied {safeDistance(selectedItem.replied_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Compose Reply Form */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Send Administrative Resolution / Reply</span>
                    <textarea
                      rows={4}
                      placeholder="Write your official response to this user..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none text-xs transition-colors"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={replying || !replyText.trim()}
                        onClick={handleSendReply}
                        className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {replying ? "Recording..." : "Record & Send Reply"}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
