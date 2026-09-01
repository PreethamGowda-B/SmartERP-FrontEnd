"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldAlert,
  Sparkles,
  Bot,
  Activity,
  Clock,
  Globe,
  User,
  Building2,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldX
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  SecurityIncident,
  SecurityEvent,
  SecurityAction,
  getSecurityIncidentDetails,
  triggerAIIncidentAnalysis
} from "@/services/securityApi"
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

interface IncidentDetailModalProps {
  incidentId: string | null
  isOpen: boolean
  onClose: () => void
  onActionTriggered?: () => void
}

export function IncidentDetailModal({
  incidentId,
  isOpen,
  onClose,
  onActionTriggered
}: IncidentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'ai_analyst' | 'remediations'>('overview')
  const [incident, setIncident] = useState<SecurityIncident | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [actions, setActions] = useState<SecurityAction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = async () => {
    if (!incidentId) return
    try {
      setIsLoading(true)
      setError(null)
      const data = await getSecurityIncidentDetails(incidentId)
      setIncident(data.incident)
      setEvents(data.correlatedEvents || [])
      setActions(data.actions || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load security incident telemetry.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && incidentId) {
      fetchDetails()
    } else {
      setIncident(null)
      setEvents([])
      setActions([])
    }
  }, [isOpen, incidentId])

  const handleTriggerAI = async () => {
    if (!incidentId) return
    try {
      setIsAnalyzing(true)
      await triggerAIIncidentAnalysis(incidentId)
      await fetchDetails()
      setActiveTab('ai_analyst')
    } catch (err: any) {
      setError(err?.message || "AI Analysis failed to run.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!isOpen) return null

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

  const aiEnrichment = incident?.ai_analysis?.geminiEnrichment

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans my-8 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-start justify-between shrink-0">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-red-400 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-slate-400">INCIDENT #{incident?.id?.substring(0, 8)}</span>
                  {incident && getSeverityBadge(incident.severity)}
                  <Badge variant="outline" className="text-slate-300 border-slate-700 font-mono text-[10px]">
                    Risk Score: {incident?.risk_score || 0}/100
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {incident?.title || 'Security Incident Details'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-slate-50/80 text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Overview & Evidence
            </button>
            <button
              onClick={() => setActiveTab('ai_analyst')}
              className={`py-3.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'ai_analyst'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-indigo-600'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Gemini AI Analyst
              {aiEnrichment && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 ml-1" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-3.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'events'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Correlated Telemetry ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('remediations')}
              className={`py-3.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'remediations'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Remediation Actions ({actions.length})
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {isLoading ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-700" />
                <p className="text-sm font-medium">Retrieving telemetry evidence & audit chain...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            ) : incident ? (
              <>
                {/* ── Tab 1: Overview ────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Deterministic Rules Banner */}
                    <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                          <span className="text-xs text-slate-400 block font-mono">DETERMINISTIC THREAT DETECTOR</span>
                          <span className="font-bold text-sm">{incident.threat_category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Correlated Events</span>
                        <span className="font-bold text-sm">{incident.event_count} signals</span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 font-medium block mb-1">Source IP Address</span>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-slate-400" />
                          <span className="font-mono font-bold text-sm text-slate-800">
                            {incident.source_ip || 'Internal / Unknown'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 font-medium block mb-1">Target User ID</span>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-mono text-xs text-slate-800 truncate block">
                            {incident.target_user_id || 'Cross-Entity Sweep'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 font-medium block mb-1">First Seen / Last Active</span>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-xs text-slate-700">
                            {safeDistanceToNow(incident.last_seen_at, 'Recently')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Incident Status Info */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Deterministic Correlation Evidence
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        Triggered under sliding-window correlation rules with calculated severity score of{" "}
                        <strong className="text-slate-900">{incident.risk_score}</strong>. 
                        All correlated raw telemetry events were aggregated into this security incident without storing plaintext credentials or auth tokens.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Tab 2: Gemini AI Security Analyst ────────────────────────── */}
                {activeTab === 'ai_analyst' && (
                  <div className="space-y-6">
                    {/* Clear distinction banner */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-indigo-950">
                              Gemini AI Security Specialist (Read-Only Advisory)
                            </h4>
                            <p className="text-xs text-indigo-800/80 mt-0.5">
                              Provides threat context, hypothesis, and suggested actions. Does not directly modify database state.
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={isAnalyzing}
                          onClick={handleTriggerAI}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-semibold shrink-0"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                              {aiEnrichment ? 'Re-Analyze with AI' : 'Run AI Analysis'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {aiEnrichment ? (
                      <div className="space-y-4">
                        {/* Summary */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Executive Threat Summary</span>
                          <p className="text-sm text-slate-800 leading-relaxed font-sans">
                            {aiEnrichment.summary || aiEnrichment.threatAssessment}
                          </p>
                        </div>

                        {/* MITRE ATT&CK Tactics */}
                        {aiEnrichment.mitreTactics && aiEnrichment.mitreTactics.length > 0 && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">MITRE ATT&CK Mapping</span>
                            <div className="flex flex-wrap gap-2">
                              {aiEnrichment.mitreTactics.map((tactic: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="bg-white text-slate-700 text-xs">
                                  {tactic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Actions */}
                        {aiEnrichment.recommendedActions && aiEnrichment.recommendedActions.length > 0 && (
                          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                              AI Recommended Playbook
                            </span>
                            <ul className="space-y-2">
                              {aiEnrichment.recommendedActions.map((rec: string, idx: number) => (
                                <li key={idx} className="text-xs text-emerald-900 flex items-start gap-2">
                                  <ChevronRight className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 p-8 space-y-3">
                        <Bot className="h-10 w-10 text-slate-400 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-700">No Gemini AI Analysis Generated Yet</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Trigger read-only Gemini analysis to enrich this incident with actor heuristics, MITRE ATT&CK correlation, and mitigation recommendations.
                        </p>
                        <Button
                          size="sm"
                          disabled={isAnalyzing}
                          onClick={handleTriggerAI}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                        >
                          {isAnalyzing ? "Analyzing Telemetry..." : "Run AI Threat Analysis"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab 3: Correlated Telemetry Events ──────────────────────── */}
                {activeTab === 'events' && (
                  <div className="space-y-4">
                    <span className="text-xs text-slate-500 font-semibold block">
                      Chronological stream of non-blocking security telemetry signals (Last {events.length} events)
                    </span>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {events.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 text-xs font-sans"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold bg-slate-100">
                              {evt.http_method || 'EVT'}
                            </Badge>
                            <div>
                              <span className="font-mono font-semibold text-slate-900 block">
                                {evt.endpoint || evt.event_type}
                              </span>
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

                      {events.length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-8">No correlated telemetry events found.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Tab 4: Remediation Actions ──────────────────────────────── */}
                {activeTab === 'remediations' && (
                  <div className="space-y-4">
                    <span className="text-xs text-slate-500 font-semibold block">
                      Deterministic Remediation Actions associated with this Incident
                    </span>

                    <div className="space-y-2">
                      {actions.map((act) => (
                        <div
                          key={act.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="font-mono text-[10px] font-bold">
                                {act.action_type}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] uppercase">
                                Status: {act.approval_status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 font-sans mt-1">
                              {act.details?.reason || 'Automated policy rule triggered'}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Executed by: {act.executed_by || (act.is_automated ? 'security-policy-engine' : 'Pending Super Admin')}
                            </span>
                          </div>
                        </div>
                      ))}

                      {actions.length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-8">No remediation actions recorded.</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-8 px-4"
            >
              Close Drawer
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
