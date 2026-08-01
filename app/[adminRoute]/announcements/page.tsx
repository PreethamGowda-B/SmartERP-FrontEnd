"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Megaphone, Send, ShieldAlert, CheckCircle2,
  BellRing, Trash2, RefreshCw, Globe
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface AnnouncementRecord {
  id: number
  title: string
  content: string
  priority: string
  created_at: string
  created_by_name: string
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-blue-50 border-blue-200 text-blue-700",
  medium: "bg-amber-50 border-amber-200 text-amber-700",
  high: "bg-red-50 border-red-200 text-red-700",
}

export default function AdminAnnouncements() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState("medium")
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<AnnouncementRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await apiClient("/api/admin/announcements")
      setHistory(res?.announcements || [])
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message) return toast.error("Broadcast message cannot be empty")

    setSending(true)
    try {
      // 1. Store in DB for history
      await apiClient("/api/admin/announcements/store", {
        method: "POST",
        body: JSON.stringify({ title, message, priority })
      }).catch(() => {})

      // 2. Broadcast as notifications to all owners
      const res = await apiClient("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ title, message, priority })
      })
      toast.success(res.message || `Broadcast sent to ${res.sent} owners!`)
      setTitle("")
      setMessage("")
      fetchHistory()
    } catch {
      toast.error("Failed to broadcast announcement")
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: number, annTitle: string) => {
    if (!confirm(`Delete announcement: "${annTitle}"?`)) return
    setDeletingId(id)
    try {
      await apiClient(`/api/admin/announcements/${id}`, { method: "DELETE" })
      toast.success("Announcement deleted")
      setHistory(prev => prev.filter(a => a.id !== id))
    } catch {
      toast.error("Failed to delete announcement")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Global Broadcast Center</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">
              Dispatch system-wide notifications to all tenants
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
            <BellRing className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Active System Channel</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form + History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Compose */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                <Megaphone className="h-48 w-48 text-slate-900" />
              </div>

              <form onSubmit={handleBroadcast} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Announcement Heading
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scheduled Maintenance — Aug 5, 2026..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-bold placeholder:text-slate-300"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Message Detail
                  </label>
                  <textarea
                    placeholder="Enter the full content of your announcement here..."
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium placeholder:text-slate-300 resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {[
                      { v: "low", label: "Info", color: "text-blue-600" },
                      { v: "medium", label: "Standard", color: "text-amber-600" },
                      { v: "high", label: "Urgent", color: "text-red-600" },
                    ].map((p) => (
                      <button
                        key={p.v}
                        type="button"
                        onClick={() => setPriority(p.v)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          priority === p.v
                            ? `bg-white ${p.color} shadow-sm border border-slate-200`
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="submit"
                    disabled={sending}
                    className="bg-slate-900 hover:bg-black text-white rounded-xl px-8 py-5 h-auto flex items-center gap-3 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                    {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? "Sending..." : "Dispatch Broadcast"}
                  </Button>
                </div>
              </form>
            </div>

            {/* History */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Broadcast History</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Persistent record of all sent announcements</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={fetchHistory} disabled={loadingHistory}>
                  <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <div className="divide-y divide-slate-50">
                {loadingHistory ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="p-5 animate-pulse">
                      <div className="h-10 bg-slate-50 rounded-xl" />
                    </div>
                  ))
                ) : history.length === 0 ? (
                  <div className="py-16 text-center">
                    <Megaphone className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 font-bold">No announcements sent yet</p>
                    <p className="text-xs text-slate-300 mt-1">Sent announcements will appear here</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {history.map((ann) => (
                      <motion.div
                        key={ann.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4 group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border shrink-0 ${
                              PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.medium
                            }`}
                          >
                            {ann.priority}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{ann.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ann.content}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {ann.created_by_name || "Admin"} •{" "}
                              {formatDistanceToNow(new Date(ann.created_at))} ago
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(ann.id, ann.title)}
                          disabled={deletingId === ann.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                        >
                          {deletingId === ann.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="p-8 rounded-[2rem] bg-slate-900 text-white space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 right-0 p-6 opacity-10">
                <ShieldAlert className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <h4 className="font-black text-lg uppercase tracking-tight mb-3">Broadcast Guidelines</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Announcements are delivered to{" "}
                  <span className="text-white font-bold">every company owner</span> as a dashboard notification.
                </p>
                <ul className="mt-5 space-y-3">
                  {[
                    "Use 'Urgent' for maintenance windows.",
                    "Clear subjects improve open rates.",
                    "All broadcasts are persisted in history.",
                    "Notifications appear immediately.",
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-400">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Delivery Info</h4>
                  <p className="text-[10px] text-slate-400">Reach metrics</p>
                </div>
              </div>
              <div className="space-y-2.5 pt-3 border-t border-slate-50">
                {[
                  ["Primary Target", "All Owners"],
                  ["Channel", "Dashboard Notification"],
                  ["History", "DB Persisted"],
                  ["Delete", "Available from history"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="font-bold text-slate-400">{label}</span>
                    <span className="font-black text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
