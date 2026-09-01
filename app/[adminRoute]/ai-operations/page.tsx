"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Brain, Sparkles, Activity, Clock, Shield, TrendingUp, BarChart3,
  AlertTriangle, CheckCircle2, Users, Building2, Zap, FileText,
  Download, RefreshCw, Filter, Search, ChevronDown, Globe,
  Package, CreditCard, CalendarCheck, FileSpreadsheet, Bot,
  MessageSquare, ChevronRight, X
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"
import { AdminLayout } from "@/components/admin-layout"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIStats {
  requestsToday: number
  requestsThisMonth: number
  mostUsedTool: string | null
  avgLatencyMs: number
  blockedRequests: number
  planBreakdown: Record<string, number>
  topCompaniesByUsage: Array<{ companyId: string; requests: number }>
  scopeBreakdown: Array<{ scope: string; count: number }>
}

interface AuditLog {
  id: string
  company_id: string
  user_id: string
  user_role: string
  tool_name: string
  action_params: any
  status: string
  error_message: string | null
  portal: string | null
  module: string | null
  plan_tier: string | null
  model_scope: string | null
  latency_ms: number | null
  confidence_score: number | null
  blocked: boolean
  prompt_preview: string | null
  created_at: string
}

interface FeedbackStats {
  total: number
  today: number
  openTickets: number
  resolvedThisMonth: number
  byType: Record<string, number>
  byStatus: Record<string, number>
}

const SCOPE_ICONS: Record<string, any> = {
  finance: TrendingUp,
  payroll: CreditCard,
  inventory: Package,
  attendance: CalendarCheck,
  hr: Users,
  gst: FileSpreadsheet,
  executive: BarChart3,
  crm: Globe,
  general: Bot,
  auto: Sparkles,
}

const SCOPE_COLORS: Record<string, string> = {
  finance: "#10B981",
  payroll: "#F43F5E",
  inventory: "#3B82F6",
  attendance: "#F59E0B",
  hr: "#06B6D4",
  gst: "#EAB308",
  executive: "#6366F1",
  crm: "#EC4899",
  general: "#64748B",
  auto: "#8B5CF6",
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

export default function AIOperationsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'feedback'>('overview')
  const [stats, setStats] = useState<AIStats | null>(null)
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [feedbackList, setFeedbackList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters for Audit Log
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [scopeFilter, setScopeFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    try {
      const [aiStatsRes, fbStatsRes, logsRes, fbRes] = await Promise.all([
        apiClient<AIStats>("/api/ai/stats").catch(() => null),
        apiClient<FeedbackStats>("/api/feedback/stats").catch(() => null),
        apiClient<{ logs?: AuditLog[]; auditLogs?: AuditLog[] }>("/api/ai/audit-logs?limit=100").catch(() => ({ logs: [] })),
        apiClient<any[]>("/api/v1/feedback").catch(() => [])
      ])

      if (aiStatsRes) setStats(aiStatsRes)
      if (fbStatsRes) setFeedbackStats(fbStatsRes)
      const logsArray = Array.isArray(logsRes) ? logsRes : (logsRes as any)?.logs || (logsRes as any)?.auditLogs || []
      setAuditLogs(logsArray)
      setFeedbackList(Array.isArray(fbRes) ? fbRes : [])
    } catch (err: any) {
      toast.error("Failed to load AI operations telemetry")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      (log.tool_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       log.user_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       log.company_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       log.module?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || log.status?.toLowerCase() === statusFilter.toLowerCase()
    const matchesScope = scopeFilter === "all" || (log.model_scope || "general").toLowerCase() === scopeFilter.toLowerCase()
    return matchesSearch && matchesStatus && matchesScope
  })

  const totalScopeUsage = (stats?.scopeBreakdown || []).reduce((acc, curr) => acc + (curr.count || 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              AI Operations & Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Google Gemini intelligence usage, rate limits, prompt audit stream, and support tickets
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
              <span>Refresh Metrics</span>
            </Button>
          </div>
        </div>

        {/* ── Tab Switcher ────────────────────────────────────────────────────── */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'overview'
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Intelligence Overview
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'audit'
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            AI Audit Stream ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'feedback'
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Feedback Tickets ({feedbackStats?.openTickets ?? 0})
          </button>
        </div>

        {/* ── Tab 1: Intelligence Overview ────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Primary KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                  <span>AI Requests (24h)</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                    {loading ? "..." : (stats?.requestsToday ?? 0).toLocaleString()}
                  </span>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Today
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">Total API calls processed today</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                  <span>Monthly AI Volume</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                    {loading ? "..." : (stats?.requestsThisMonth ?? 0).toLocaleString()}
                  </span>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                    30 Days
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">Platform-wide monthly usage</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                  <span>Avg Latency</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                    {loading ? "..." : `${((stats?.avgLatencyMs ?? 850) / 1000).toFixed(2)}s`}
                  </span>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                    Fast
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">Average Gemini response turnaround</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                  <span>Blocked / Gated</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                    {loading ? "..." : (stats?.blockedRequests ?? 0).toLocaleString()}
                  </span>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                    Plan Limits
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">Rate limits or quota boundaries enforced</p>
              </div>
            </div>

            {/* Scope Distribution Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Model Scopes */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    AI Tool & Scope Distribution
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Queries categorised by business operational scope</p>
                </div>

                <div className="space-y-3 pt-2">
                  {(stats?.scopeBreakdown || []).map((s) => {
                    const ScopeIcon = SCOPE_ICONS[s.scope] || Bot
                    const color = SCOPE_COLORS[s.scope] || "#64748B"
                    const percent = totalScopeUsage > 0 ? Math.round((s.count / totalScopeUsage) * 100) : 0

                    return (
                      <div key={s.scope} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <ScopeIcon className="h-3.5 w-3.5" style={{ color }} />
                            <span className="font-bold text-slate-800 capitalize">{s.scope} Intelligence</span>
                          </div>
                          <span className="font-mono text-slate-500">{s.count} ({percent}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.max(percent, 4)}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {(!stats?.scopeBreakdown || stats.scopeBreakdown.length === 0) && (
                    <p className="py-8 text-center text-xs text-slate-400">No scope distribution recorded.</p>
                  )}
                </div>
              </div>

              {/* Right: Top Companies by AI Usage */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Top Organizations by AI Adoption
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Tenants with highest Gemini Copilot consumption</p>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                  {(stats?.topCompaniesByUsage || []).map((c, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 truncate">
                          {c.companyId || `Tenant #${idx + 1}`}
                        </span>
                      </div>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono font-bold">
                        {c.requests} requests
                      </Badge>
                    </div>
                  ))}
                  {(!stats?.topCompaniesByUsage || stats.topCompaniesByUsage.length === 0) && (
                    <p className="py-8 text-center text-xs text-slate-400">No company usage telemetry yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: AI Audit Stream ──────────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by tool name, user role, organization, or module..."
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
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="intercepted">Intercepted</option>
                </select>

                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                  aria-label="Filter by Scope"
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
                >
                  <option value="all">All Scopes</option>
                  <option value="finance">Finance</option>
                  <option value="payroll">Payroll</option>
                  <option value="inventory">Inventory</option>
                  <option value="attendance">Attendance</option>
                  <option value="hr">HR</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 pl-6">Tool / Function</th>
                      <th className="py-3.5">Module Scope</th>
                      <th className="py-3.5">Actor & Role</th>
                      <th className="py-3.5">Latency</th>
                      <th className="py-3.5">Status</th>
                      <th className="py-3.5">Timestamp</th>
                      <th className="py-3.5 text-right pr-6">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 pl-6"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-4 pr-6 text-right"><div className="h-4 w-12 bg-slate-100 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Bot className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No AI audit entries found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pl-6">
                            <span className="font-mono font-bold text-slate-900 block truncate">
                              {log.tool_name || "ai_completion"}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Tenant: {log.company_id || "Global"}
                            </span>
                          </td>

                          <td className="py-3.5">
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] capitalize">
                              {log.model_scope || log.module || "General"}
                            </Badge>
                          </td>

                          <td className="py-3.5">
                            <span className="font-semibold text-slate-800 block capitalize">
                              {log.user_role || "User"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.user_id ? `${log.user_id.slice(0, 8)}...` : "System"}
                            </span>
                          </td>

                          <td className="py-3.5 font-mono text-[11px] text-slate-600">
                            {log.latency_ms ? `${log.latency_ms}ms` : "—"}
                          </td>

                          <td className="py-3.5">
                            <Badge className={
                              log.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                                : log.status === "BLOCKED" || log.blocked
                                ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold"
                                : "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold"
                            }>
                              {log.status || "SUCCESS"}
                            </Badge>
                          </td>

                          <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                            {safeDistance(log.created_at)}
                          </td>

                          <td className="py-3.5 pr-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="h-8 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                            >
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Feedback Tickets ─────────────────────────────────────────── */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200/80">
                <h3 className="text-sm font-bold text-slate-900">User Submitted Tickets & Inquiries</h3>
                <p className="text-xs text-slate-500">Live feed from feedback and feature request forms</p>
              </div>

              <div className="divide-y divide-slate-100">
                {feedbackList.length === 0 ? (
                  <p className="p-12 text-center text-xs text-slate-400">No tickets found.</p>
                ) : (
                  feedbackList.map((fb) => (
                    <div key={fb.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold uppercase">
                            {fb.type || "General"}
                          </Badge>
                          <Badge className={
                            fb.status === 'replied'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              : "bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold"
                          }>
                            {fb.status === 'replied' ? "Replied" : "Open Ticket"}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-slate-900 truncate">{fb.subject || "No Subject"}</h4>
                        <p className="text-slate-600 line-clamp-2">{fb.message}</p>
                        <span className="text-[11px] text-slate-400 font-mono block pt-1">
                          By: {fb.user_email || "Anonymous"} • {safeDistance(fb.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Log Detail Modal ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedLog(null)}
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      {selectedLog.tool_name || "AI Event Details"}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Log ID: {selectedLog.id}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="h-7 w-7 rounded-lg text-slate-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 font-mono">
                    <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="font-bold text-slate-800">{selectedLog.status}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Latency:</span><span className="font-bold text-slate-800">{selectedLog.latency_ms}ms</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Scope:</span><span className="font-bold text-slate-800">{selectedLog.model_scope || "general"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tenant:</span><span className="font-bold text-slate-800">{selectedLog.company_id}</span></div>
                  </div>

                  {selectedLog.prompt_preview && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700">Prompt Preview / Context:</span>
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {selectedLog.prompt_preview}
                      </div>
                    </div>
                  )}

                  {selectedLog.action_params && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700">Execution Parameters:</span>
                      <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] overflow-x-auto">
                        {JSON.stringify(selectedLog.action_params, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.error_message && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-mono text-[11px]">
                      <strong>Error:</strong> {selectedLog.error_message}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)} className="h-9 px-4 rounded-xl text-xs font-semibold">
                    Close
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
