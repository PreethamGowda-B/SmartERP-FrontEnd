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

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return
    const interval = setInterval(() => {
      loadData(false)
    }, autoRefreshInterval * 1000)
    return () => clearInterval(interval)
  }, [autoRefreshInterval, loadData])

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
        return <Badge className="bg-red-600 text-white font-bold animate-pulse px-3 py-1">CRITICAL THREAT LEVEL</Badge>
      case 'HIGH':
        return <Badge className="bg-amber-600 text-white font-bold px-3 py-1">HIGH THREAT LEVEL</Badge>
      case 'ELEVATED':
        return <Badge className="bg-blue-600 text-white font-bold px-3 py-1">ELEVATED THREAT LEVEL</Badge>
      default:
        return <Badge className="bg-emerald-600 text-white font-bold px-3 py-1">NORMAL DEFENSIVE POSTURE</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-red-500/15 text-red-700 border-red-300 font-semibold uppercase text-[10px]">Critical</Badge>
      case 'high':
        return <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 font-semibold uppercase text-[10px]">High</Badge>
      case 'medium':
        return <Badge className="bg-blue-500/15 text-blue-700 border-blue-300 font-semibold uppercase text-[10px]">Medium</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-semibold uppercase text-[10px]">Low</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-600 space-y-4">
        <ShieldAlert className="h-12 w-12 text-slate-800 animate-pulse" />
        <div className="text-center">
          <h3 className="font-bold text-slate-900 text-base">Initializing Security Operations Center</h3>
          <p className="text-xs text-slate-500 mt-1">Connecting to authenticated Super Admin security cluster...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── Top Bar / Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 rounded-2xl text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-red-400 shrink-0">
            <Radio className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400">SMARTERP PLATFORM SOC</span>
              {stats && getThreatLevelPill(stats.healthStatus.threatLevel)}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Security Operations Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic sliding-window threat detection, read-only AI enrichment, and controlled remediation.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              aria-label="SOC Auto-Refresh Rate"
              className="bg-transparent font-medium focus:outline-none text-slate-200 cursor-pointer"
            >
              <option value={15} className="bg-slate-800">Auto: 15s</option>
              <option value={30} className="bg-slate-800">Auto: 30s</option>
              <option value={60} className="bg-slate-800">Auto: 60s</option>
              <option value={0} className="bg-slate-800">Auto: Off</option>
            </select>
          </div>

          <Button
            size="sm"
            disabled={isRefreshing}
            onClick={() => loadData(true)}
            className="bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs h-9 px-4 rounded-xl shadow"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </motion.div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── KPI Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Active Incidents</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.healthStatus?.activeIncidents || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">unresolved</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono pt-1">
            <span className="text-red-600 font-bold">{stats?.incidentBreakdown?.bySeverity?.critical || 0} Critical</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{stats?.incidentBreakdown?.bySeverity?.high || 0} High</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>24h Ingested Signals</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.metrics24h?.eventsIngested || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">telemetry events</span>
          </div>
          <p className="text-[11px] text-slate-500">Sliding-window buffer with atomic Redis count</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Automated Actions</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.metrics24h?.automatedActionsExecuted || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">executed safely</span>
          </div>
          <p className="text-[11px] text-slate-500">Reversible IP quarantines & session resets</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 transition-all ${
          pendingActions.length > 0 
            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={pendingActions.length > 0 ? 'text-amber-800 font-bold' : 'text-slate-500'}>
              Pending Approvals
            </span>
            <Lock className={`h-4 w-4 ${pendingActions.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight ${
              pendingActions.length > 0 ? 'text-amber-900' : 'text-slate-900'
            }`}>
              {pendingActions.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">sensitive actions</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {pendingActions.length > 0 ? 'Requires Super Admin confirmation' : 'No pending human reviews'}
          </p>
        </div>
      </div>

      {/* ── Main Tab Navigation ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-slate-50/60 font-semibold text-xs">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-4 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'incidents'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Security Incidents ({incidents.length})
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-4 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-amber-800'
            }`}
          >
            <Lock className="h-4 w-4 text-amber-600" />
            Pending Approvals
            {pendingActions.length > 0 && (
              <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0 h-4">
                {pendingActions.length}
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`py-4 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'actions'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Action History ({historicalActions.length})
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-4 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="h-4 w-4" />
            Live Event Stream
          </button>
        </div>

        {/* ── Tab Content: Incidents ────────────────────────────────────────── */}
        {activeTab === 'incidents' && (
          <div className="p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Search by IP, threat category, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  aria-label="Filter incidents by severity"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter incidents by status"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700"
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
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className="p-4 bg-white hover:bg-slate-50/90 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 shrink-0 mt-0.5">
                      <ShieldAlert className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          #{incident.id.substring(0, 8)}
                        </span>
                        {getSeverityBadge(incident.severity)}
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                          Score: {incident.risk_score}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold text-slate-600">
                          {incident.threat_category}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{incident.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                        <span>IP: {incident.source_ip || 'N/A'}</span>
                        <span>•</span>
                        <span>Signals: {incident.event_count}</span>
                        <span>•</span>
                        <span>
                          {incident.last_seen_at ? formatDistanceToNow(new Date(incident.last_seen_at), { addSuffix: true }) : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {incident.ai_analysis?.geminiEnrichment && (
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Enriched
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      Investigate <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredIncidents.length === 0 && (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <ShieldCheck className="h-8 w-8 mx-auto text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-700">No matching security incidents found</p>
                  <p className="text-xs text-slate-400">Your platform defenses are actively monitoring traffic.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Content: Pending Approvals ────────────────────────────────── */}
        {activeTab === 'approvals' && (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <strong className="font-semibold block mb-0.5">Super Admin Approval Queue</strong>
              The deterministic policy engine has identified critical threats requiring sensitive modifications. Human approval is strictly enforced.
            </div>

            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600 text-white font-mono text-[10px] font-bold">
                        {action.action_type}
                      </Badge>
                      <Badge variant="outline" className="text-amber-700 border-amber-300 font-semibold text-[10px]">
                        PENDING APPROVAL
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {action.id.substring(0, 8)}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900">{action.details?.reason || 'Critical security rule matched'}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      {action.details?.ipAddress && <span>Target IP: {action.details.ipAddress}</span>}
                      {action.details?.userId && <span>Target User: {action.details.userId}</span>}
                      {action.details?.companyId && <span>Company: {action.details.companyId}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenActionDialog(action, 'reject')}
                      className="text-xs h-8 text-slate-600 hover:text-red-700"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenActionDialog(action, 'approve')}
                      className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Approve & Execute
                    </Button>
                  </div>
                </div>
              ))}

              {pendingActions.length === 0 && (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-700">All pending approvals cleared</p>
                  <p className="text-xs text-slate-400">No remediation actions currently await Super Admin review.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Content: Action History ───────────────────────────────────── */}
        {activeTab === 'actions' && (
          <div className="p-6 space-y-4">
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {historicalActions.map((action) => (
                <div
                  key={action.id}
                  className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono font-bold text-[10px]">
                        {action.action_type}
                      </Badge>
                      <Badge className={`text-[10px] uppercase font-semibold ${
                        action.approval_status === 'executed'
                          ? 'bg-emerald-500/15 text-emerald-700 border-emerald-300'
                          : action.approval_status === 'reverted'
                          ? 'bg-blue-500/15 text-blue-700 border-blue-300'
                          : action.approval_status === 'rejected'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-red-500/15 text-red-700'
                      }`}>
                        {action.approval_status}
                      </Badge>
                      {action.is_automated && (
                        <span className="text-[10px] text-slate-400 font-mono">(Automated Policy)</span>
                      )}
                    </div>
                    <p className="text-slate-800 font-medium">{action.details?.reason || 'Remediation rule executed'}</p>
                    <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                      Executed by: {action.executed_by || 'System'} • {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {action.approval_status === 'executed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenActionDialog(action, 'revert')}
                      className="text-xs h-8 text-blue-700 hover:bg-blue-50 border-blue-200 shrink-0"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Rollback Action
                    </Button>
                  )}
                </div>
              ))}

              {historicalActions.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-12">No historical remediation actions found.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Content: Live Event Stream ────────────────────────────────── */}
        {activeTab === 'telemetry' && (
          <div className="p-6 space-y-4">
            <span className="text-xs text-slate-500 font-semibold block">
              Recent Non-Blocking Security Telemetry Events from SmartERP Edge (Last 25 events)
            </span>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
              {stats?.recentEvents?.map((evt) => (
                <div key={evt.id} className="p-3.5 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold bg-slate-100">
                      {evt.http_method || 'EVENT'}
                    </Badge>
                    <div>
                      <span className="font-mono font-semibold text-slate-900 block">{evt.endpoint || evt.event_type}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        IP: {evt.ip_address || 'N/A'} • Status: {evt.status_code || 200}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {getSeverityBadge(evt.severity)}
                    <span className="block text-[10px] text-slate-400 mt-1">
                      {format(new Date(evt.created_at), 'HH:mm:ss')}
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

      {/* ── Incident Detail Modal ───────────────────────────────────────────── */}
      <IncidentDetailModal
        incidentId={selectedIncidentId}
        isOpen={Boolean(selectedIncidentId)}
        onClose={() => setSelectedIncidentId(null)}
        onActionTriggered={() => loadData(true)}
      />

      {/* ── Sensitive Action Confirmation Dialog ────────────────────────────── */}
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
