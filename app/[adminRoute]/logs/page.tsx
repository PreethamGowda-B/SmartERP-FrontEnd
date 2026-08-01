"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ScrollText, AlertTriangle, LogIn, CreditCard, RefreshCw, ChevronDown,
  Clock, Globe, User, Shield
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

type LogTab = "login" | "error" | "payment" | "audit"

interface LogEntry {
  id: number | string
  action?: string
  email?: string
  user_name?: string
  role?: string
  company_name?: string
  created_at: string
  ip_address?: string
  message?: string
  level?: string
}

const TAB_CONFIG = {
  login: { label: "Login Logs", icon: LogIn, endpoint: "/api/admin/logs/login", field: "logs" },
  error: { label: "Error Logs", icon: AlertTriangle, endpoint: "/api/admin/logs/error", field: "logs" },
  payment: { label: "Payment Logs", icon: CreditCard, endpoint: "/api/admin/subscriptions/history", field: "history" },
  audit: { label: "Audit Trail", icon: ScrollText, endpoint: "/api/admin/audit-trail", field: "activities" },
}

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState<LogTab>("login")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = async (tab: LogTab = activeTab, p = 1) => {
    setLoading(true)
    const config = TAB_CONFIG[tab]
    try {
      const res = await apiClient(`${config.endpoint}?page=${p}&limit=30`)
      const data = res?.[config.field] || []
      setLogs(Array.isArray(data) ? data : [])
      setPage(res?.pagination?.page || 1)
      setTotalPages(res?.pagination?.pages || 1)
      setTotal(res?.pagination?.total || data.length)
    } catch {
      toast.error("Failed to load logs")
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs(activeTab, 1) }, [activeTab])

  const switchTab = (tab: LogTab) => {
    setActiveTab(tab)
    setPage(1)
    setLogs([])
  }

  const ACTION_COLORS: Record<string, string> = {
    login: "bg-emerald-50 text-emerald-700 border-emerald-200",
    login_google: "bg-blue-50 text-blue-700 border-blue-200",
    logout: "bg-slate-100 text-slate-600 border-slate-200",
    customer_login: "bg-purple-50 text-purple-700 border-purple-200",
    customer_login_success: "bg-purple-50 text-purple-700 border-purple-200",
    customer_logout: "bg-slate-100 text-slate-600 border-slate-200",
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Logs</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">
              Platform-wide audit trail, login history & error logs
            </p>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => fetchLogs(activeTab, page)}
            disabled={loading}
            className="rounded-xl h-10 font-bold gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {(Object.entries(TAB_CONFIG) as [LogTab, typeof TAB_CONFIG[LogTab]][]).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Log Count */}
        {total > 0 && (
          <p className="text-xs text-slate-500 font-bold">
            Showing {logs.length} of {total} entries
          </p>
        )}

        {/* Log Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="p-5 animate-pulse">
                  <div className="h-10 bg-slate-50 rounded-xl" />
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="py-20 text-center">
                <ScrollText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400">No log entries found</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {logs.map((log, i) => (
                  <motion.div
                    key={`${log.id}-${i}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="p-5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Action badge */}
                        {log.action && (
                          <div className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border mt-0.5 ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {log.action.replace(/_/g, ' ')}
                          </div>
                        )}
                        {log.level && (
                          <div className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border mt-0.5 ${
                            log.level === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                            log.level === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {log.level}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            {log.user_name && (
                              <span className="text-sm font-black text-slate-900">{log.user_name}</span>
                            )}
                            {log.email && (
                              <span className="text-xs text-slate-500 font-medium">{log.email}</span>
                            )}
                            {log.message && (
                              <span className="text-sm font-bold text-slate-700 truncate">{log.message}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 flex-wrap">
                            {log.company_name && (
                              <span className="text-[10px] text-slate-400 font-bold">{log.company_name}</span>
                            )}
                            {log.role && (
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{log.role}</span>
                            )}
                            {log.ip_address && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Globe className="h-3 w-3" />
                                <span className="font-mono">{log.ip_address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(log.created_at))} ago</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => { const np = Math.max(1, page-1); setPage(np); fetchLogs(activeTab, np) }}
                  disabled={page <= 1 || loading}
                  className="rounded-xl h-8 px-3 text-xs font-bold"
                >
                  Prev
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => { const np = Math.min(totalPages, page+1); setPage(np); fetchLogs(activeTab, np) }}
                  disabled={page >= totalPages || loading}
                  className="rounded-xl h-8 px-3 text-xs font-bold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
