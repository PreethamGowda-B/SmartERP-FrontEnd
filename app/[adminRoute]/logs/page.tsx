"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Laptop,
  AlertTriangle,
  CreditCard,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  X,
  Calendar,
  Activity,
  User
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"

function safeDistance(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Recently"
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState<'login' | 'error' | 'audit' | 'payments'>('login')
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Data states
  const [loginLogs, setLoginLogs] = useState<any[]>([])
  const [errorLogs, setErrorLogs] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [paymentLogs, setPaymentLogs] = useState<any[]>([])
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  // Stack trace / Detail modal
  const [selectedError, setSelectedError] = useState<any | null>(null)

  const fetchLogs = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    setLoading(true)
    try {
      if (activeTab === 'login') {
        const res = await apiClient<{ logs: any[]; pagination: { total: number } }>(`/api/admin/logs/login?page=${page}&limit=25`)
        setLoginLogs(res?.logs || [])
        setTotalItems(res?.pagination?.total || 0)
      } else if (activeTab === 'error') {
        const res = await apiClient<{ logs: any[]; pagination: { total: number } }>(`/api/admin/logs/error?page=${page}&limit=25`)
        setErrorLogs(res?.logs || [])
        setTotalItems(res?.pagination?.total || 0)
      } else if (activeTab === 'audit') {
        const res = await apiClient<any[]>(`/api/activities?page=${page}&limit=25`).catch(() => [])
        const items = Array.isArray(res) ? res : (res as any)?.activities || []
        setAuditLogs(items)
        setTotalItems(items.length)
      } else if (activeTab === 'payments') {
        const res = await apiClient<{ payments: any[]; pagination: { total: number } }>(`/api/admin/payments?page=${page}&limit=25`)
        setPaymentLogs(res?.payments || [])
        setTotalItems(res?.pagination?.total || 0)
      }
    } catch {
      toast.error(`Failed to load ${activeTab} logs`)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [activeTab, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleTabChange = (newTab: 'login' | 'error' | 'audit' | 'payments') => {
    setActiveTab(newTab)
    setPage(1)
    setSearchQuery("")
  }

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              System Logs & Forensic Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Cross-cluster authentication events, runtime exceptions, financial ledgers, and administrative actions
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh Logs</span>
          </Button>
        </div>

        {/* ── Tab Switcher & Search Bar ───────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => handleTabChange('login')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'login' ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>Login History</span>
            </button>

            <button
              onClick={() => handleTabChange('error')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'error' ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Runtime Errors</span>
            </button>

            <button
              onClick={() => handleTabChange('audit')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'audit' ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Platform Audit Trail</span>
            </button>

            <button
              onClick={() => handleTabChange('payments')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'payments' ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Payment Logs</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Filter current view..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-white border-slate-200 text-xs font-medium"
            />
          </div>
        </div>

        {/* ── Main Data Viewport ──────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Tab 1: Login History */}
          {activeTab === 'login' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 pl-6">Actor & Identity</th>
                    <th className="py-3.5">Action Event</th>
                    <th className="py-3.5">Organization</th>
                    <th className="py-3.5">Source IP</th>
                    <th className="py-3.5 text-right pr-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 pl-6"><div className="h-4 w-36 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                        <td className="py-4 pr-6 text-right"><div className="h-4 w-20 bg-slate-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : loginLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No login events recorded.
                      </td>
                    </tr>
                  ) : (
                    loginLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pl-6 font-bold text-slate-900">
                          {log.user_name || "User"}
                          <span className="block text-[11px] font-normal text-slate-400">{log.email}</span>
                        </td>
                        <td className="py-3.5">
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-[10px] capitalize">
                            {log.action?.replace('_', ' ') || "login"}
                          </Badge>
                        </td>
                        <td className="py-3.5 font-medium text-slate-700">
                          {log.company_name || "System"}
                        </td>
                        <td className="py-3.5 font-mono text-slate-500 text-[11px]">
                          {log.ip_address || "127.0.0.1"}
                        </td>
                        <td className="py-3.5 pr-6 text-right text-slate-400 font-mono text-[11px]">
                          {safeDistance(log.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Runtime Error Logs */}
          {activeTab === 'error' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 pl-6">Error Message & Stack</th>
                    <th className="py-3.5">Endpoint / Route</th>
                    <th className="py-3.5">Status Code</th>
                    <th className="py-3.5">Timestamp</th>
                    <th className="py-3.5 text-right pr-6">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 pl-6"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-12 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                        <td className="py-4 pr-6 text-right"><div className="h-4 w-12 bg-slate-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : errorLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No runtime errors recorded. System healthy.
                      </td>
                    </tr>
                  ) : (
                    errorLogs.map((err) => (
                      <tr key={err.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pl-6 font-mono text-rose-700 font-bold max-w-md truncate">
                          {err.error_message || err.message || "Unknown Exception"}
                        </td>
                        <td className="py-3.5 font-mono text-slate-600">
                          {err.endpoint || "/api/v1"}
                        </td>
                        <td className="py-3.5">
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-mono text-[10px] font-bold">
                            {err.status_code || 500}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                          {safeDistance(err.created_at)}
                        </td>
                        <td className="py-3.5 pr-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedError(err)}
                            className="h-8 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                          >
                            Stack Trace
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Platform Audit Trail */}
          {activeTab === 'audit' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 pl-6">Operation Action</th>
                    <th className="py-3.5">Actor</th>
                    <th className="py-3.5">Organization</th>
                    <th className="py-3.5">IP Address</th>
                    <th className="py-3.5 text-right pr-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 pl-6"><div className="h-4 w-36 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                        <td className="py-4 pr-6 text-right"><div className="h-4 w-20 bg-slate-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No audit events recorded.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pl-6">
                          <Badge className="bg-slate-100 text-slate-800 border-slate-200 font-mono text-[10px] font-bold">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3.5 font-semibold text-slate-800">
                          {log.user_name || "Admin"}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {log.company_name || "Platform"}
                        </td>
                        <td className="py-3.5 font-mono text-slate-500 text-[11px]">
                          {log.ip_address || "Internal"}
                        </td>
                        <td className="py-3.5 pr-6 text-right text-slate-400 font-mono text-[11px]">
                          {safeDistance(log.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 4: Payment Logs */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 pl-6">TX ID</th>
                    <th className="py-3.5">Organization</th>
                    <th className="py-3.5">Tier Plan</th>
                    <th className="py-3.5">Status</th>
                    <th className="py-3.5 text-right pr-6">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 pl-6"><div className="h-4 w-12 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                        <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                        <td className="py-4 pr-6 text-right"><div className="h-4 w-20 bg-slate-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : paymentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No payment transactions found.
                      </td>
                    </tr>
                  ) : (
                    paymentLogs.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pl-6 font-mono font-bold text-slate-700">
                          #{p.id}
                        </td>
                        <td className="py-3.5 font-bold text-slate-900">
                          {p.company_name || `Company #${p.company_id}`}
                        </td>
                        <td className="py-3.5">
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                            {p.plan_name || "Tier"}
                          </Badge>
                        </td>
                        <td className="py-3.5">
                          <Badge className={
                            p.status === 'refunded'
                              ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                          }>
                            {p.status || "active"}
                          </Badge>
                        </td>
                        <td className="py-3.5 pr-6 text-right text-slate-400 font-mono text-[11px]">
                          {safeDistance(p.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Pagination */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">
              Showing page <strong>{page}</strong> ({totalItems} total records)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-lg text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || totalItems < 25}
                onClick={() => setPage(p => p + 1)}
                className="h-8 px-3 rounded-lg text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Error Stack Trace Modal ─────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedError && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedError(null)}
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto font-sans"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Exception Forensic Details
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedError.endpoint} • Status {selectedError.status_code || 500}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedError(null)} className="h-7 w-7 rounded-lg text-slate-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-mono text-[11px]">
                    <strong>Message:</strong> {selectedError.error_message || selectedError.message}
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-700">Stack Trace:</span>
                    <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto max-h-60">
                      {selectedError.stack_trace || selectedError.stack || "No call stack captured."}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedError(null)} className="h-9 px-4 rounded-xl text-xs font-semibold">
                    Close Inspector
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
