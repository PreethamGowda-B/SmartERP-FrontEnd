/**
 * Super Admin Security Operations Center (SOC) API Service
 * Exclusively communicates with server-side protected /api/v1/superadmin/security endpoints.
 */

import { apiClient } from "@/lib/apiClient"

export type ThreatCategory =
  | 'SUPERADMIN_PROBE'
  | 'CROSS_TENANT_IDOR'
  | 'CREDENTIAL_STUFFING'
  | 'PRIVILEGE_ESCALATION'
  | 'ROUTE_SCAN'
  | 'MULTI_VECTOR_SURGE'
  | 'GENERAL_ANOMALY'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'investigating' | 'mitigated' | 'resolved' | 'closed'
export type ActionApprovalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'reverted' | 'failed'

export interface SecurityIncident {
  id: string
  company_id: string | null
  title: string
  threat_category: ThreatCategory
  status: IncidentStatus
  severity: IncidentSeverity
  risk_score: number
  source_ip: string | null
  target_user_id: string | null
  event_count: number
  first_seen_at: string
  last_seen_at: string
  ai_analysis?: {
    geminiEnrichment?: {
      summary?: string
      threatAssessment?: string
      mitreTactics?: string[]
      recommendedActions?: string[]
      confidenceScore?: number
      analyzedAt?: string
    }
    evidenceSnapshot?: any
  }
  created_at: string
  updated_at: string
}

export interface SecurityEvent {
  id: string
  company_id: string | null
  user_id: string | null
  event_type: string
  severity: IncidentSeverity
  ip_address: string | null
  endpoint: string | null
  http_method: string | null
  status_code: number | null
  metadata: Record<string, any>
  created_at: string
}

export interface SecurityAction {
  id: string
  incident_id: string | null
  company_id: string | null
  action_type: string
  is_automated: boolean
  approval_status: ActionApprovalStatus
  executed_by: string | null
  reverted_at: string | null
  reverted_by: string | null
  details: {
    ruleId?: string
    reason?: string
    ipAddress?: string
    userId?: string
    companyId?: string
    durationMinutes?: number
    executionDetails?: any
    executionError?: string
    rejectedBy?: string
    revertedBy?: string
    [key: string]: any
  }
  created_at: string
}

export interface SecurityDashboardStats {
  healthStatus: {
    threatLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL'
    activeIncidents: number
    criticalCount: number
    highCount: number
    pendingApprovals: number
  }
  incidentBreakdown: {
    bySeverity: {
      critical: number
      high: number
      medium: number
      low: number
    }
    byCategory: Record<string, number>
    byStatus: Record<string, number>
  }
  metrics24h: {
    eventsIngested: number
    automatedActionsExecuted: number
    mitigatedThreats: number
  }
  recentIncidents: SecurityIncident[]
  pendingActions: SecurityAction[]
  recentEvents: SecurityEvent[]
}

export interface IncidentDetailsResponse {
  success: boolean
  incident: SecurityIncident
  correlatedEvents: SecurityEvent[]
  actions: SecurityAction[]
}

/**
 * Fetch SOC Dashboard aggregation metrics and active threats
 */
export async function getSecurityDashboard(): Promise<SecurityDashboardStats> {
  const res = await apiClient.get<{ success: boolean; stats: SecurityDashboardStats }>(
    "/api/v1/superadmin/security/dashboard"
  )
  return res.stats
}

/**
 * Fetch list of security incidents with optional filtering
 */
export async function getSecurityIncidents(params?: {
  status?: string
  severity?: string
  threatCategory?: string
  limit?: number
}): Promise<SecurityIncident[]> {
  const query = new URLSearchParams()
  if (params?.status && params.status !== 'all') query.set('status', params.status)
  if (params?.severity && params.severity !== 'all') query.set('severity', params.severity)
  if (params?.threatCategory && params.threatCategory !== 'all') query.set('threatCategory', params.threatCategory)
  if (params?.limit) query.set('limit', String(params.limit))

  const queryString = query.toString() ? `?${query.toString()}` : ''
  const res = await apiClient.get<{ success: boolean; incidents: SecurityIncident[] }>(
    `/api/v1/superadmin/security/incidents${queryString}`
  )
  return res.incidents || []
}

/**
 * Fetch full incident details, correlated telemetry events, and remediation actions
 */
export async function getSecurityIncidentDetails(incidentId: string): Promise<IncidentDetailsResponse> {
  return await apiClient.get<IncidentDetailsResponse>(
    `/api/v1/superadmin/security/incidents/${incidentId}`
  )
}

/**
 * Trigger read-only Gemini Security Analyst enrichment on-demand
 */
export async function triggerAIIncidentAnalysis(incidentId: string): Promise<{
  success: boolean
  message: string
  enrichment: any
}> {
  return await apiClient.post(
    `/api/v1/superadmin/security/incidents/${incidentId}/analyze`
  )
}

/**
 * Fetch security remediation actions list
 */
export async function getSecurityActions(params?: {
  status?: string
  incidentId?: string
}): Promise<SecurityAction[]> {
  const query = new URLSearchParams()
  if (params?.status && params.status !== 'all') query.set('status', params.status)
  if (params?.incidentId) query.set('incidentId', params.incidentId)

  const queryString = query.toString() ? `?${query.toString()}` : ''
  const res = await apiClient.get<{ success: boolean; actions: SecurityAction[] }>(
    `/api/v1/superadmin/security/actions${queryString}`
  )
  return res.actions || []
}

/**
 * Super Admin explicitly approves a pending sensitive security action
 */
export async function approveSecurityAction(actionId: string): Promise<{
  success: boolean
  message: string
  action: SecurityAction
}> {
  return await apiClient.post(
    `/api/v1/superadmin/security/actions/${actionId}/approve`
  )
}

/**
 * Super Admin rejects a pending sensitive security action
 */
export async function rejectSecurityAction(actionId: string): Promise<{
  success: boolean
  message: string
  action: SecurityAction
}> {
  return await apiClient.post(
    `/api/v1/superadmin/security/actions/${actionId}/reject`
  )
}

/**
 * Super Admin reverts / rolls back a previously executed security action
 */
export async function revertSecurityAction(actionId: string): Promise<{
  success: boolean
  message: string
  action: SecurityAction
}> {
  return await apiClient.post(
    `/api/v1/superadmin/security/actions/${actionId}/revert`
  )
}
