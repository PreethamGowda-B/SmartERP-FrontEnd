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
  ai_analysis_reasoning?: string
  is_resolved: boolean
  resolution_notes?: string
  created_at: string
}

export const payrollValidationApi = {
  validatePreRun: async (month: number, year: number, proposedPayroll: any[] = []) => {
    return await apiClient("/api/v1/payroll-validation/validate-pre-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year, proposedPayroll }),
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
