import { apiClient } from "@/lib/apiClient"

export interface PayrollValidationRun {
  id: string
  company_id: string
  created_by: string
  month: number
  year: number
  total_employees_checked: number
  total_anomalies_found: number
  risk_level: "low" | "warning" | "critical"
  is_approved: boolean
  approved_by?: string
  approved_at?: string
  created_at: string
  audit_status: "passed" | "needs_review" | "failed" | "unable_to_validate" | "no_records" | "processing"
  record_count: number
  checks_executed: number
  check_results: PayrollAuditCheck[]
  is_stale?: boolean
}

export interface PayrollAuditCheck {
  id: string
  label: string
  status: "passed" | "warning" | "failed" | "not_applicable" | "unable_to_validate"
  records_examined: number
  findings_count: number
  explanation: string
}

export interface PayrollValidationFlag {
  id: string
  validation_run_id: string
  company_id: string
  user_id?: string
  employee_name: string
  flag_type: "duplicate_bank" | "salary_spike" | "inactive_user" | "attendance_mismatch" | "statutory_error" | "negative_payout" | "zero_salary"
  severity: "info" | "warning" | "critical"
  description: string
  source_record_id?: string
  source_table?: string
  finding_details?: Record<string, unknown>
  ai_analysis_reasoning?: string
  is_resolved: boolean
  resolution_notes?: string
  created_at: string
}

export const payrollValidationApi = {
  validatePreRun: async (month: number, year: number) => {
    return await apiClient("/api/v1/payroll-validation/validate-pre-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    })
  },

  getRunDetails: async (runId: string) => {
    return await apiClient(`/api/v1/payroll-validation/validation-runs/${runId}`)
  },

  resolveFlag: async (flagId: string, resolutionNotes: string) => {
    return await apiClient(`/api/v1/payroll-validation/validation-flags/${flagId}/resolve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolutionNotes }),
    })
  },

  approvePreRun: async (runId: string) => {
    return await apiClient("/api/v1/payroll-validation/approve-pre-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId }),
    })
  },
}
