"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion } from "framer-motion"
import {
  Brain, Sparkles, Activity, Clock, Shield, TrendingUp, BarChart3,
  AlertTriangle, CheckCircle2, Users, Building2, Zap, FileText,
  Download, RefreshCw, Filter, Search, ChevronDown, Globe,
  Package, CreditCard, CalendarCheck, FileSpreadsheet, Bot
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"

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

// ─── Constants ────────────────────────────────────────────────────────────────

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
  finance: "from-emerald-500 to-green-600",
  payroll: "from-pink-500 to-rose-600",
  inventory: "from-blue-500 to-blue-600",
  attendance: "from-orange-500 to-amber-600",
  hr: "from-cyan-500 to-teal-600",
  gst: "from-yellow-500 to-orange-600",
  executive: "from-indigo-500 to-blue-700",
  crm: "from-red-500 to-pink-600",
  general: "from-slate-500 to-slate-600",
  auto: "from-violet-500 to-purple-600",
}

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  FAILED: "bg-red-500/15 text-red-600 border-red-500/30",
  INTERCEPTED: "bg-amber-500/15 text-amber-600 border-amber-500/30",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  icon: Icon, label, value, subValue, gradient, delay = 0
}: {
  icon: any; label: string; value: string | number; subValue?: string; gradient: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5 shadow-sm"
    >
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 bg-gradient-to-br", gradient)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black text-foreground mt-1">{value}</p>
          {subValue && <p className="text-[11px] text-muted-foreground mt-0.5">{subValue}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", gradient)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

function ScopeBar({ scope, count, total }: { scope: string; count: number; total: number }) {
  const Icon = SCOPE_ICONS[scope] || Bot
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const gradient = SCOPE_COLORS[scope] || SCOPE_COLORS.general

  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0", gradient)}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-foreground capitalize">{scope}</span>
          <span className="text-xs text-muted-foreground font-medium">{count} · {pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "audit", label: "Audit Log", icon: FileText },
  { key: "tickets", label: "Support Tickets", icon: AlertTriangle },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIOperationsPage() {
  const [tab, setTab] = useState<"overview" | "audit" | "tickets">("overview")
  const [stats, setStats] = useState<AIStats | null>(null)
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [auditSearch, setAuditSearch] = useState("")
  const [auditStatusFilter, setAuditStatusFilter] = useState("all")
  const [ticketSearch, setTicketSearch] = useState("")
  const [ticketTypeFilter, setTicketTypeFilter] = useState("all")
  const [refreshKey, setRefreshKey] = useState(0)

  // ── Load stats
  useEffect(() => {
    setLoadingStats(true)
    Promise.all([
      apiClient("/api/ai/stats").catch(() => null),
      apiClient("/api/feedback/stats").catch(() => null),
    ]).then(([aiStats, fbStats]) => {
      if (aiStats) setStats(aiStats)
      if (fbStats) setFeedbackStats(fbStats)
    }).finally(() => setLoadingStats(false))
  }, [refreshKey])

  // ── Load audit logs when tab changes
  useEffect(() => {
    if (tab !== "audit") return
    setLoadingAudit(true)
    apiClient("/api/ai/audit-logs?limit=100")
      .then((data) => setAuditLogs(data?.logs || []))
      .catch(() => setAuditLogs([]))
      .finally(() => setLoadingAudit(false))
  }, [tab, refreshKey])

  // ── Load tickets
  useEffect(() => {
    if (tab !== "tickets") return
    setLoadingTickets(true)
    apiClient("/api/feedback")
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
      .finally(() => setLoadingTickets(false))
  }, [tab, refreshKey])

  const filteredLogs = auditLogs.filter(log => {
    if (auditStatusFilter !== "all" && log.status !== auditStatusFilter) return false
    if (auditSearch) {
      const q = auditSearch.toLowerCase()
      return (
        log.company_id?.includes(q) ||
        log.user_id?.includes(q) ||
        log.tool_name?.toLowerCase().includes(q) ||
        log.model_scope?.toLowerCase().includes(q) ||
        log.prompt_preview?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const filteredTickets = tickets.filter(t => {
    if (ticketTypeFilter !== "all" && t.type !== ticketTypeFilter) return false
    if (ticketSearch) {
      const q = ticketSearch.toLowerCase()
      return (
        t.subject?.toLowerCase().includes(q) ||
        t.message?.toLowerCase().includes(q) ||
        t.user_name?.toLowerCase().includes(q) ||
        t.user_email?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalScopeUsage = stats?.scopeBreakdown?.reduce((s, r) => s + r.count, 0) || 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              AI Operations Center
            </h1>
            <p className="text-xs text-muted-foreground mt-1 ml-11">
              Monitor SmartERP Intelligence usage, audit logs, and support tickets
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(k => k + 1)}
            className="gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border/40 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                tab === t.key
                  ? "bg-background shadow-sm text-foreground border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={Activity} label="AI Requests Today" value={loadingStats ? "—" : stats?.requestsToday ?? 0}
                gradient="from-violet-500 to-purple-600" delay={0} />
              <KPICard icon={TrendingUp} label="Requests This Month" value={loadingStats ? "—" : stats?.requestsThisMonth ?? 0}
                gradient="from-blue-500 to-indigo-600" delay={0.05} />
              <KPICard icon={Clock} label="Avg Response Time" value={loadingStats ? "—" : `${((stats?.avgLatencyMs ?? 0) / 1000).toFixed(1)}s`}
                subValue="Per AI request" gradient="from-emerald-500 to-teal-600" delay={0.1} />
              <KPICard icon={Shield} label="Blocked Requests" value={loadingStats ? "—" : stats?.blockedRequests ?? 0}
                subValue="Plan-gated this month" gradient="from-rose-500 to-red-600" delay={0.15} />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={AlertTriangle} label="Open Tickets" value={loadingStats ? "—" : feedbackStats?.openTickets ?? 0}
                subValue="Awaiting response" gradient="from-amber-500 to-orange-600" delay={0.2} />
              <KPICard icon={CheckCircle2} label="Resolved (Month)" value={loadingStats ? "—" : feedbackStats?.resolvedThisMonth ?? 0}
                subValue="Feedback replied" gradient="from-emerald-500 to-green-600" delay={0.25} />
              <KPICard icon={FileText} label="Total Feedback" value={loadingStats ? "—" : feedbackStats?.total ?? 0}
                gradient="from-cyan-500 to-blue-600" delay={0.3} />
              <KPICard icon={Sparkles} label="Most Used Model" value={loadingStats ? "—" : (stats?.mostUsedTool ? stats.mostUsedTool.split(":")[1] || stats.mostUsedTool : "—")}
                subValue="This month" gradient="from-fuchsia-500 to-pink-600" delay={0.35} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Scope Usage */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  AI Model Usage Distribution
                </h3>
                {loadingStats ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-8 rounded-lg bg-muted/40 animate-pulse" />
                    ))}
                  </div>
                ) : stats?.scopeBreakdown && stats.scopeBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {stats.scopeBreakdown.map(({ scope, count }) => (
                      <ScopeBar key={scope} scope={scope} count={count} total={totalScopeUsage} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">No AI usage data yet</p>
                )}
              </motion.div>

              {/* Plan Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Plan Tier Breakdown
                </h3>
                <div className="space-y-4">
                  {["pro", "basic", "free"].map(plan => {
                    const count = stats?.planBreakdown?.[plan] ?? 0
                    const total = Object.values(stats?.planBreakdown || {}).reduce((a, b) => a + b, 0) || 1
                    const pct = Math.round((count / total) * 100)
                    const gradients: Record<string, string> = {
                      pro: "from-violet-500 to-indigo-600",
                      basic: "from-blue-500 to-blue-600",
                      free: "from-slate-400 to-slate-500",
                    }
                    return (
                      <div key={plan}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-semibold capitalize text-foreground">{plan} Plan</span>
                          <span className="text-xs text-muted-foreground">{count} requests · {pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={cn("h-full rounded-full bg-gradient-to-r", gradients[plan])}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Feedback type breakdown */}
                {feedbackStats && (
                  <div className="mt-6 pt-4 border-t border-border/40">
                    <h4 className="text-xs font-bold text-foreground mb-3">Support Ticket Categories</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(feedbackStats.byType || {}).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
                          <span className="text-[11px] font-medium capitalize text-foreground">{type.replace(/_/g, " ")}</span>
                          <Badge className="text-[10px] h-5 px-1.5">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Top Companies */}
            {stats?.topCompaniesByUsage && stats.topCompaniesByUsage.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-5 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Top Companies by AI Usage (This Month)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-2 px-3 text-muted-foreground font-semibold">#</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Company ID</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-semibold">AI Requests</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-semibold">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topCompaniesByUsage.map((c, i) => {
                        const total = stats.topCompaniesByUsage.reduce((s, r) => s + r.requests, 0) || 1
                        return (
                          <tr key={c.companyId} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 text-muted-foreground font-bold">{i + 1}</td>
                            <td className="py-2.5 px-3 font-mono text-foreground">{c.companyId}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-foreground">{c.requests}</td>
                            <td className="py-2.5 px-3 text-right text-muted-foreground">
                              {Math.round((c.requests / total) * 100)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── AUDIT LOG TAB ──────────────────────────────────────────────── */}
        {tab === "audit" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  placeholder="Search by company, user, tool, prompt..."
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <select
                value={auditStatusFilter}
                onChange={e => setAuditStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="INTERCEPTED">Intercepted</option>
              </select>
              <Badge className="text-xs px-3 py-1 bg-muted/60 text-muted-foreground border-border/40">
                {filteredLogs.length} entries
              </Badge>
            </div>

            {loadingAudit ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 overflow-hidden bg-card/80">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/40">
                        {["Time", "Company", "Role", "Plan", "Model Scope", "Tool", "Latency", "Confidence", "Status"].map(h => (
                          <th key={h} className="text-left px-3 py-3 text-muted-foreground font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.created_at), "MMM d, HH:mm")}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-foreground">{log.company_id}</td>
                          <td className="px-3 py-2.5">
                            <Badge className={cn("text-[9px] h-4 px-1.5 capitalize",
                              log.user_role === "owner" ? "bg-violet-500/15 text-violet-600 border-violet-500/20" :
                              log.user_role === "hr" ? "bg-blue-500/15 text-blue-600 border-blue-500/20" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {log.user_role}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge className={cn("text-[9px] h-4 px-1.5 capitalize",
                              log.plan_tier === "pro" ? "bg-violet-500/15 text-violet-600 border-violet-500/20" :
                              log.plan_tier === "basic" ? "bg-blue-500/15 text-blue-600 border-blue-500/20" :
                              "bg-muted/60 text-muted-foreground"
                            )}>
                              {log.plan_tier || "—"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            {log.model_scope ? (
                              <span className="font-semibold text-foreground capitalize">{log.model_scope.replace("AI_REQUEST:", "")}</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-3 py-2.5 max-w-[120px] truncate text-muted-foreground" title={log.tool_name}>
                            {log.tool_name}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {log.latency_ms ? `${(log.latency_ms / 1000).toFixed(1)}s` : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {log.confidence_score ? `${Math.round(log.confidence_score * 100)}%` : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge className={cn("text-[9px] h-4 px-1.5", STATUS_COLORS[log.status] || "bg-muted text-muted-foreground")}>
                              {log.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-3 py-10 text-center text-xs text-muted-foreground">
                            No audit logs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TICKETS TAB ───────────────────────────────────────────────── */}
        {tab === "tickets" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={ticketSearch}
                  onChange={e => setTicketSearch(e.target.value)}
                  placeholder="Search tickets..."
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <select
                value={ticketTypeFilter}
                onChange={e => setTicketTypeFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground"
              >
                <option value="all">All Types</option>
                <option value="bug">Bug</option>
                <option value="feature_request">Feature Request</option>
                <option value="performance">Performance</option>
                <option value="ui_ux">UI/UX</option>
                <option value="security">Security</option>
                <option value="billing">Billing</option>
                <option value="general">General</option>
              </select>
              <Badge className="text-xs px-3 py-1 bg-muted/60 text-muted-foreground border-border/40">
                {filteredTickets.length} tickets
              </Badge>
            </div>

            {loadingTickets ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => {
                  const severityColors: Record<string, string> = {
                    critical: "bg-red-500/15 text-red-600 border-red-500/30",
                    high: "bg-orange-500/15 text-orange-600 border-orange-500/30",
                    medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
                    low: "bg-green-500/15 text-green-600 border-green-500/30",
                  }
                  const typeIcons: Record<string, any> = {
                    bug: AlertTriangle,
                    feature_request: Sparkles,
                    performance: Activity,
                    security: Shield,
                    billing: CreditCard,
                    general: FileText,
                    ui_ux: Globe,
                  }
                  const TypeIcon = typeIcons[ticket.type] || FileText

                  return (
                    <div key={ticket.id} className="rounded-2xl border border-border/60 bg-card/80 p-4 hover:bg-card transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-bold text-foreground truncate">{ticket.subject || "No Subject"}</h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {ticket.severity && (
                                <Badge className={cn("text-[9px] h-4 px-1.5 capitalize", severityColors[ticket.severity] || severityColors.medium)}>
                                  {ticket.severity}
                                </Badge>
                              )}
                              <Badge className={cn("text-[9px] h-4 px-1.5",
                                ticket.status === "replied" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" :
                                "bg-amber-500/15 text-amber-600 border-amber-500/20"
                              )}>
                                {ticket.status || "new"}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ticket.message}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {ticket.user_name && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />{ticket.user_name}
                              </span>
                            )}
                            {ticket.portal && (
                              <span className="text-[10px] text-muted-foreground capitalize">{ticket.portal} portal</span>
                            )}
                            {ticket.module && (
                              <span className="text-[10px] text-muted-foreground capitalize">{ticket.module}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {ticket.ai_summary && (
                            <div className="mt-2 p-2 rounded-lg bg-violet-500/5 border border-violet-500/15">
                              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5" />AI Summary
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{ticket.ai_summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {filteredTickets.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No support tickets found
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}
