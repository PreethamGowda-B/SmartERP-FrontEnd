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
export type EmployeeStatus = 'pending' | 'accepted' | 'declined';

export interface Job {
  id: string;
  title: string;
  description: string | null;
  status: JobStatus;
  priority: JobPriority;
  employee_status: EmployeeStatus;
  progress: number;
  assigned_to: string | null;
  assigned_employee_name: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  declined_at: string | null;
  source: 'owner' | 'customer';
  customer_id: string | null;
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

export type SSEEventType = 'connected' | 'job_accepted' | 'job_progress' | 'job_completed' | 'reconnect';

export interface SSEEvent {
  type: SSEEventType;
  jobId?: string;
  employeeName?: string;
  acceptedAt?: string;
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
