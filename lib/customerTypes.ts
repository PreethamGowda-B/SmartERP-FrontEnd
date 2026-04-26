/**
 * lib/customerTypes.ts
 *
 * TypeScript interfaces for the Prozync Client Portal.
 * Completely separate from existing SmartERP types.
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface CustomerJWTPayload {
  id: string;
  role: 'customer';
  companyId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_id: string | null;
  auth_provider: 'manual' | 'google';
  is_verified: boolean;
  created_at: string;
}

export interface AuthState {
  customer: CustomerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export type JobStatus = 'open' | 'pending' | 'in_progress' | 'active' | 'completed' | 'closed' | 'cancelled';
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EmployeeStatus = 'assigned' | 'accepted' | 'arrived' | 'declined';
export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

export interface Job {
  id: string;
  title: string;
  description: string | null;
  // Execution status (job_status)
  status: JobStatus;
  // Approval workflow status (separate from execution)
  approval_status: ApprovalStatus;
  priority: JobPriority;
  ai_suggested_priority: JobPriority | null;
  priority_overridden: boolean;
  // Employee workflow status (separate from job status)
  employee_status: EmployeeStatus;
  progress: number;
  assigned_to: string | null;
  assigned_employee_name: string | null;
  // Timeline timestamps
  created_at: string;
  approved_at: string | null;
  assigned_at: string | null;
  started_at: string | null;
  accepted_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  declined_at: string | null;
  rejected_at: string | null;
  // SLA
  sla_accept_breached: boolean;
  sla_completion_breached: boolean;
  // Source
  source: 'owner' | 'customer';
  customer_id: string | null;
  scheduled_at: string | null;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateJobPayload {
  title: string;
  description?: string;
  priority?: JobPriority;
  scheduled_at?: string;
}

// ── Invoice ───────────────────────────────────────────────────────────────────

export interface InvoiceBreakdown {
  labor?: { hours: number; rate: number; cost: number };
  materials?: { cost: number };
  service_charge?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  labor_hours: number;
  labor_cost: number;
  materials_cost: number;
  service_charge: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid';
  breakdown: InvoiceBreakdown;
  generated_at: string;
}

// ── Materials ─────────────────────────────────────────────────────────────────

export interface JobMaterial {
  id: string;
  item_name: string;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  logged_at: string;
  logged_by_name: string | null;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface CustomerNotification {
  id: string;
  type: string;
  details: {
    customer_id?: string;
    title?: string;
    message?: string;
    job_id?: string;
  };
  created_at: string;
}

// ── Tracking ──────────────────────────────────────────────────────────────────

export interface TrackingData {
  available: boolean;
  reason?: string;
  employeeName?: string;
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  is_online?: boolean;
}

// ── SSE Events ────────────────────────────────────────────────────────────────

export type SSEEventType = 'connected' | 'job_accepted' | 'job_progress' | 'job_completed' | 'job_approved' | 'job_rejected' | 'employee_arrived' | 'reconnect';

export interface SSEEvent {
  type: SSEEventType;
  event_id?: string;       // Section 3: unique ID for deduplication
  timestamp?: string;      // ISO timestamp from server
  jobId?: string;
  employeeName?: string;
  acceptedAt?: string;
  arrivedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  progress?: number;
  status?: JobStatus;
  completedAt?: string;
  reason?: string;
}

// ── Company ───────────────────────────────────────────────────────────────────

export interface CompanyValidationResult {
  valid: boolean;
  companyName?: string;
}
