"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import {
  Megaphone,
  Send,
  ShieldAlert,
  CheckCircle2,
  BellRing,
  Trash2,
  RefreshCw,
  Globe,
  AlertTriangle,
  Clock,
  User,
  X,
  Radio,
  Eye
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface AnnouncementRecord {
  id: number
  title: string
  content: string
  priority: string
  created_at: string
  created_by_name?: string
  created_by_email?: string
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

export default function AdminAnnouncements() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<AnnouncementRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementRecord | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const fetchHistory = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    try {
      const res = await apiClient<{ announcements: AnnouncementRecord[] }>("/api/admin/announcements")
      setHistory(res?.announcements || [])
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleBroadcast = async () => {
    if (!message.trim()) {
      toast.error("Broadcast message cannot be empty")
      return
    }

    setSending(true)
    try {
      const res = await apiClient<{ message: string; sent: number }>("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ title, message, priority })
      })

      toast.success(res.message || `Broadcast delivered to ${res.sent} company owners!`)
      setTitle("")
      setMessage("")
      setShowConfirmModal(false)
      fetchHistory(true)
    } catch (err: any) {
      toast.error(err?.message || "Failed to broadcast announcement")
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiClient(`/api/admin/announcements/${id}`, { method: "DELETE" })
      setHistory(prev => prev.filter(a => a.id !== id))
      toast.success("Broadcast record removed from history")
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete announcement")
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Global Broadcast Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Dispatch push notifications and high-priority platform advisories to all registered company owners
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHistory(true)}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh Feed</span>
          </Button>
        </div>

        {/* ── 2-Column Composer & Live Preview Grid ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Composer Form (3 cols) */}
          <div className="lg:col-span-3 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-indigo-600" />
                  Compose Multi-Tenant Announcement
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Dispatches in real-time to all tenant notification streams</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Announcement Subject / Headline</label>
                <Input
                  type="text"
                  placeholder="e.g. Scheduled Infrastructure Maintenance Window..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Priority Level</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPriority("low")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      priority === "low"
                        ? "bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Low (Informational)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("medium")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      priority === "medium"
                        ? "bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Medium (General)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("high")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      priority === "high"
                        ? "bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    High (Urgent Alert)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Broadcast Content</label>
                <textarea
                  rows={4}
                  placeholder="Write clear, professional instructions or platform updates..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={sending || !message.trim()}
                  className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Broadcast</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Live Preview (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-500" />
                Live Notification Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">How this broadcast appears in tenant dashboards</p>

              <div className="mt-4 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={
                    priority === 'high'
                      ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold"
                      : priority === 'medium'
                      ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold"
                      : "bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold"
                  }>
                    {priority.toUpperCase()} PRIORITY
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {title || "System Announcement"}
                </h4>
                <p className="text-xs text-slate-600 whitespace-pre-wrap">
                  {message || "Broadcast message content will appear here in the real-time notification drawer..."}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
              <Radio className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>Broadcasts are delivered via PostgreSQL notifications and displayed in all active tenant sessions.</span>
            </div>
          </div>
        </div>

        {/* ── Broadcast History Table ─────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Previous Broadcast Dispatches</h3>
              <p className="text-xs text-slate-500">Chronological history of platform-wide messages</p>
            </div>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-mono font-bold">
              {history.length} Dispatched
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-6">Title & Message</th>
                  <th className="py-3.5">Priority</th>
                  <th className="py-3.5">Sent By</th>
                  <th className="py-3.5">Timestamp</th>
                  <th className="py-3.5 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingHistory ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 pl-6"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="py-4 pr-6 text-right"><div className="h-4 w-8 bg-slate-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No broadcast history recorded yet.
                    </td>
                  </tr>
                ) : (
                  history.map((ann) => (
                    <tr key={ann.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-6 min-w-0 max-w-md">
                        <span className="font-bold text-slate-900 block truncate">
                          {ann.title || "Platform Announcement"}
                        </span>
                        <span className="text-slate-500 line-clamp-1 text-[11px] mt-0.5">
                          {ann.content}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <Badge className={
                          ann.priority === 'high'
                            ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold uppercase"
                            : ann.priority === 'medium'
                            ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold uppercase"
                            : "bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold uppercase"
                        }>
                          {ann.priority || "MEDIUM"}
                        </Badge>
                      </td>

                      <td className="py-3.5 text-slate-700 font-medium">
                        {ann.created_by_name || "Super Admin"}
                      </td>

                      <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                        {safeDistance(ann.created_at)}
                      </td>

                      <td className="py-3.5 pr-6 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(ann)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Broadcast Confirmation Modal ────────────────────────────────────── */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirmModal(false)}
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Confirm Global Broadcast</h3>
                      <p className="text-xs text-slate-500">Deliver announcement to all company owners</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowConfirmModal(false)} className="h-7 w-7 rounded-lg text-slate-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <p className="font-bold text-slate-800">{title || "System Announcement"}</p>
                  <p className="text-slate-600 text-[11px] whitespace-pre-wrap">{message}</p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)} className="h-9 px-4 rounded-xl text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={sending}
                    onClick={handleBroadcast}
                    className="h-9 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending ? "Delivering..." : "Confirm & Send"}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
        <AnimatePresence>
          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteTarget(null)}
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Delete Announcement</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to remove this record?</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(null)} className="h-7 w-7 rounded-lg text-slate-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 px-4 rounded-xl text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDelete(deleteTarget.id)}
                    className="h-9 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Delete Record
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
