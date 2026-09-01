"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Activity,
  CheckCircle2,
  RefreshCw,
  Clock,
  UserCheck,
  UserX,
  Lock,
  Globe,
  Radio,
  FileText,
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Ban,
  Check,
  X,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  SecurityDashboardStats,
  SecurityIncident,
  SecurityAction,
  SecurityEvent,
  getSecurityDashboard,
  getSecurityIncidents,
  getSecurityActions,
  approveSecurityAction,
  rejectSecurityAction,
  revertSecurityAction
} from "@/services/securityApi"
import { SecurityActionDialog } from "./SecurityActionDialog"
import { IncidentDetailModal } from "./IncidentDetailModal"
import { formatDistanceToNow, format } from "date-fns"

function safeDistanceToNow(dateInput: any, fallback = 'Recently'): string {
  if (!dateInput) return fallback
  try {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return fallback
    return formatDistanceToNow(d, { addSuffix: true })
  } catch (_) {
    return fallback
  }
}

export function SecurityDashboardView() {
  const [stats, setStats] = useState<SecurityDashboardStats | null>(null)
  const [incidents, setIncidents] = useState<SecurityIncident[]>([])
  const [actions, setActions] = useState<SecurityAction[]>([])
  const [activeTab, setActiveTab] = useState<'incidents' | 'approvals' | 'actions' | 'telemetry'>('incidents')
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30) // seconds (0 = off)

  // Loading / Feedback states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  // Modals & Action Confirmation states
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [actionDialogState, setActionDialogState] = useState<{
    isOpen: boolean
    action: SecurityAction | null
    mode: 'approve' | 'reject' | 'revert'
  }>({
    isOpen: false,
    action: null,
    mode: 'approve'
  })

  const loadData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true)
      setError(null)

      const [dashboardStats, incidentList, actionList] = await Promise.all([
        getSecurityDashboard(),
        getSecurityIncidents({ severity: severityFilter, status: statusFilter }),
        getSecurityActions()
      ])

      setStats(dashboardStats)
      setIncidents(incidentList)
      setActions(actionList)
    } catch (err: any) {
      if (err?.status === 403) {
        setError("Access Denied: Super Admin privilege required to view Security Operations Center.")
      } else {
        setError(err?.message || "Failed to load Security Operations Center data.")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [severityFilter, statusFilter])

  // Initial fetch and auto-refresh timer
  useEffect(() => {
    loadData()

    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        loadData(true)
      }, autoRefreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [loadData, autoRefreshInterval])

  // Action handlers
  const handleOpenActionDialog = (action: SecurityAction, mode: 'approve' | 'reject' | 'revert') => {
    setActionDialogState({ isOpen: true, action, mode })
  }

  const handleConfirmAction = async (actionId: string) => {
    const { mode } = actionDialogState
    if (mode === 'approve') {
      const res = await approveSecurityAction(actionId)
      setSuccessNotice(`Action approved and executed: ${res.action.action_type}`)
    } else if (mode === 'reject') {
      const res = await rejectSecurityAction(actionId)
      setSuccessNotice(`Action proposal rejected: ${res.action.action_type}`)
    } else if (mode === 'revert') {
      const res = await revertSecurityAction(actionId)
      setSuccessNotice(`Action rolled back / reverted successfully: ${res.action.action_type}`)
    }
    await loadData(true)
    setTimeout(() => setSuccessNotice(null), 5000)
  }

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      inc.title?.toLowerCase().includes(query) ||
      inc.threat_category?.toLowerCase().includes(query) ||
      inc.source_ip?.toLowerCase().includes(query) ||
      inc.target_user_id?.toLowerCase().includes(query)
    )
  })

  // Pending Actions
  const pendingActions = actions.filter((act) => act.approval_status === 'pending')
  const historicalActions = actions.filter((act) => act.approval_status !== 'pending')

  const getThreatLevelPill = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse px-2.5 py-0.5 text-xs">CRITICAL THREAT POSTURE</Badge>
      case 'HIGH':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold px-2.5 py-0.5 text-xs">HIGH THREAT LEVEL</Badge>
      case 'ELEVATED':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-2.5 py-0.5 text-xs">ELEVATED THREAT LEVEL</Badge>
      default:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-0.5 text-xs">NORMAL DEFENSIVE POSTURE</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-extrabold text-[10px] tracking-wider uppercase">CRITICAL</Badge>
      case 'high':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] tracking-wider uppercase">HIGH</Badge>
      case 'medium':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-[10px] tracking-wider uppercase">MEDIUM</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-medium text-[10px] tracking-wider uppercase">LOW</Badge>
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'SUPERADMIN_PROBE':
        return { label: 'Admin Route Probe', icon: ShieldAlert, color: 'text-red-500' }
      case 'CROSS_TENANT_IDOR':
        return { label: 'Cross-Tenant IDOR', icon: ShieldX, color: 'text-amber-500' }
      case 'CREDENTIAL_STUFFING':
        return { label: 'Credential Stuffing', icon: Lock, color: 'text-orange-500' }
      case 'PRIVILEGE_ESCALATION':
        return { label: 'Privilege Escalation', icon: AlertTriangle, color: 'text-red-600' }
      case 'ROUTE_SCAN':
        return { label: 'Route Enumeration', icon: Globe, color: 'text-blue-500' }
      default:
        return { label: category || 'Security Anomaly', icon: Activity, color: 'text-slate-500' }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500 font-semibold">Connecting to authenticated Super Admin security cluster...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* ── Enterprise Light SOC Header Banner ──────────────────────────────── */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Radio className="h-6 w-6 text-indigo-600 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400">SMARTERP PLATFORM SOC</span>
              {getThreatLevelPill(stats?.healthStatus?.threatLevel || 'NORMAL')}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">
              Security Operations Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic sliding-window threat detection, read-only AI enrichment, and controlled remediation.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              aria-label="SOC Auto-Refresh Rate"
              className="bg-transparent font-semibold focus:outline-none text-slate-800 cursor-pointer"
            >
              <option value={15}>Auto: 15s</option>
              <option value={30}>Auto: 30s</option>
              <option value={60}>Auto: 60s</option>
              <option value={0}>Auto: Off</option>
            </select>
          </div>

          <Button
            size="sm"
            disabled={isRefreshing}
            onClick={() => loadData(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </motion.div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── KPI Metric Cards (4 Cards) ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Active Incidents */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Active Incidents</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {stats?.healthStatus?.activeIncidents || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">unresolved</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono pt-1">
            <span className="text-rose-600 font-bold">{stats?.incidentBreakdown?.bySeverity?.critical || 0} Critical</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{stats?.incidentBreakdown?.bySeverity?.high || 0} High</span>
          </div>
        </div>

        {/* Ingested Signals */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>24h Ingested Signals</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {stats?.metrics24h?.eventsIngested || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">telemetry events</span>
          </div>
          <p className="text-[11px] text-slate-400">Sliding-window buffer with atomic Redis count</p>
        </div>

        {/* Automated Actions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Automated Actions</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {stats?.metrics24h?.automatedActionsExecuted || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">executed safely</span>
          </div>
          <p className="text-[11px] text-slate-400">Reversible IP quarantines & session resets</p>
        </div>

        {/* Pending Approvals */}
        <div className={`p-5 rounded-2xl border shadow-2xs space-y-2 transition-all ${
          pendingActions.length > 0 
            ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20' 
            : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={pendingActions.length > 0 ? 'text-amber-800 font-bold' : 'text-slate-500'}>
              Pending Approvals
            </span>
            <Lock className={`h-4 w-4 ${pendingActions.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight tabular-nums ${
              pendingActions.length > 0 ? 'text-amber-900' : 'text-slate-900'
            }`}>
              {pendingActions.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">sensitive actions</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {pendingActions.length > 0 ? 'Requires Super Admin confirmation' : 'No pending human reviews'}
          </p>
        </div>
      </div>

      {/* ── Main Tab Navigation & Content ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-2 px-6 border-b border-slate-200/80 bg-slate-50/60 font-semibold text-xs">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-3.5 px-2 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'incidents'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Incidents Radar</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-mono">
              {filteredIncidents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-3.5 px-2 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Pending Approvals</span>
            {pendingActions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                {pendingActions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3.5 px-2 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'actions'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Action & Audit History</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3.5 px-2 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Live Telemetry Buffer</span>
          </button>
        </div>

        {/* ── Tab 1: Incidents Radar ─────────────────────────────────────────── */}
        {activeTab === 'incidents' && (
          <div className="p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter by title, category, IP address, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  aria-label="Filter by Severity"
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="low">Low Only</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by Status"
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="mitigated">Mitigated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Incidents List */}
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
              {filteredIncidents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs space-y-1">
                  <ShieldCheck className="h-8 w-8 mx-auto text-emerald-500 opacity-60 mb-2" />
                  <p className="font-semibold text-slate-700">No active incidents matching criteria.</p>
                  <p className="text-[11px] text-slate-400">All sliding-window detection filters operating normally.</p>
                </div>
              ) : (
                filteredIncidents.map((incident) => {
                  const catInfo = getCategoryLabel(incident.threat_category)
                  const CatIcon = catInfo.icon

                  return (
                    <div
                      key={incident.id}
                      onClick={() => setSelectedIncidentId(incident.id)}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
                          <CatIcon className={`h-5 w-5 ${catInfo.color}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {getSeverityBadge(incident.severity)}
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                              {catInfo.label}
                            </Badge>
                            <span className="text-[10px] font-mono text-slate-400">
                              Score: <strong className="text-slate-700">{incident.risk_score}</strong>
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {incident.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                            <span>IP: {incident.source_ip || 'N/A'}</span>
                            <span>•</span>
                            <span>Signals: {incident.event_count}</span>
                            <span>•</span>
                            <span>{safeDistanceToNow(incident.last_seen_at, 'Active')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {incident.ai_analysis?.geminiEnrichment && (
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Analyzed
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIncidentId(incident.id)
                          }}
                          className="text-xs h-8 text-indigo-600 hover:bg-indigo-50"
                        >
                          Investigate
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── Tab 2: Pending Approvals ───────────────────────────────────────── */}
        {activeTab === 'approvals' && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-500">
              High-impact mitigation rules (e.g. permanent IP block, organization suspension) are paused here awaiting Super Admin signoff.
            </p>

            {pendingActions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                <p className="font-semibold text-slate-700">No pending actions awaiting approval.</p>
                <p className="text-[11px]">All defensive rules currently auto-executing within safe policy limits.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingActions.map((action) => (
                  <div
                    key={action.id}
                    className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold uppercase">
                          {action.action_type}
                        </Badge>
                        <span className="text-xs font-mono text-slate-400">Target IP: {action.details?.ipAddress || 'Cluster'}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{action.details?.reason || 'Threat mitigation proposed'}</p>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        Proposed {safeDistanceToNow(action.created_at, 'Recently')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenActionDialog(action, 'reject')}
                        className="text-xs h-9 text-rose-700 hover:bg-rose-50 border-rose-200"
                      >
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        Reject Proposal
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenActionDialog(action, 'approve')}
                        className="text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Approve & Execute
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Action & Audit History ──────────────────────────────────── */}
        {activeTab === 'actions' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Log of all deterministic, automated, and human-approved remediation actions with 1-click state rollback.
              </p>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
              {historicalActions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No previous action history recorded.
                </div>
              ) : (
                historicalActions.map((action) => (
                  <div
                    key={action.id}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold uppercase font-mono">
                          {action.action_type}
                        </Badge>
                        <Badge className={
                          action.approval_status === 'executed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold'
                            : action.approval_status === 'reverted'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold'
                            : 'bg-slate-100 text-slate-600 text-[10px]'
                        }>
                          {action.approval_status}
                        </Badge>
                        {action.is_automated && (
                          <span className="text-[10px] text-slate-400 font-mono">(Automated Policy)</span>
                        )}
                      </div>
                      <p className="text-slate-800 font-medium">{action.details?.reason || 'Remediation rule executed'}</p>
                      <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                        Executed by: {action.executed_by || 'System'} • {safeDistanceToNow(action.created_at, 'Recently')}
                      </span>
                    </div>

                    {action.approval_status === 'executed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenActionDialog(action, 'revert')}
                        className="text-xs h-8 text-indigo-700 hover:bg-indigo-50 border-indigo-200 shrink-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Rollback Action
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Tab 4: Live Telemetry Buffer ──────────────────────────────────── */}
        {activeTab === 'telemetry' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Live stream of sanitized raw telemetry events fed into the sliding-window detector.
              </p>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono">
                Stream Active
              </Badge>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
              {stats?.recentEvents?.map((evt: SecurityEvent) => (
                <div key={evt.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-slate-700 text-[11px] shrink-0">
                      {evt.http_method || 'POST'}
                    </span>
                    <span className="font-mono text-slate-900 truncate">
                      {evt.endpoint || '/api/v1/auth'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0 hidden sm:inline">
                      IP: {evt.ip_address || '127.0.0.1'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-[11px] text-slate-500">
                      Status: {evt.status_code || 200}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {safeDistanceToNow(evt.created_at, 'Recently')}
                    </span>
                  </div>
                </div>
              ))}

              {(!stats?.recentEvents || stats.recentEvents.length === 0) && (
                <p className="text-center text-xs text-slate-400 py-12">No recent security signals recorded.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Incident Detail Modal Drawer ────────────────────────────────────── */}
      <IncidentDetailModal
        incidentId={selectedIncidentId}
        isOpen={Boolean(selectedIncidentId)}
        onClose={() => setSelectedIncidentId(null)}
        onActionTriggered={() => loadData(true)}
      />

      {/* ── Action Confirmation Dialog ──────────────────────────────────────── */}
      <SecurityActionDialog
        isOpen={actionDialogState.isOpen}
        action={actionDialogState.action}
        mode={actionDialogState.mode}
        onClose={() => setActionDialogState({ isOpen: false, action: null, mode: 'approve' })}
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}
