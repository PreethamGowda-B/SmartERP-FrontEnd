import { apiClient } from "@/lib/apiClient"

export interface GstReconciliationRun {
  id: string
  company_id: string
  created_by: string
  financial_period: string
  gstr_type: "GSTR_2A" | "GSTR_2B"
  version: number
  is_latest: boolean
  total_books_invoices: number
  total_portal_invoices: number
  total_matched: number
  total_mismatched: number
  total_itc_claimed: number | string
  total_itc_blocked: number | string
  status: "draft" | "processing" | "completed" | "failed"
  created_at: string
}

export interface GstReconciliationItem {
  id: string
  reconciliation_run_id: string
  company_id: string
  supplier_gstin: string
  supplier_name: string
  invoice_number_books: string
  invoice_number_portal: string
  invoice_date_books: string
  invoice_date_portal: string
  taxable_value_books: number | string
  taxable_value_portal: number | string
  cgst_books: number | string
  cgst_portal: number | string
  sgst_books: number | string
  sgst_portal: number | string
  igst_books: number | string
  igst_portal: number | string
  variance_amount: number | string
  match_status: "exact_match" | "fuzzy_match" | "tax_mismatch" | "missing_in_gstr" | "missing_in_books" | "manual_overridden"
  confidence_score: number | string
  ai_match_reasoning: string
  vendor_notified: boolean
  vendor_notified_at?: string
  created_at: string
}

export const gstReconciliationApi = {
  requestGspOtp: async (gstin: string, username: string) => {
    const res = await apiClient.post("/api/v1/gst-reconciliation/asp/request-otp", { gstin, username })
    return res.data
  },

  verifyGspOtp: async (gstin: string, otp: string, requestId?: string) => {
    const res = await apiClient.post("/api/v1/gst-reconciliation/asp/verify-otp", { gstin, otp, requestId })
    return res.data
  },

  triggerRun: async (payload: {
    financialPeriod: string
    gstrType?: "GSTR_2A" | "GSTR_2B"
    booksInvoices: any[]
    portalInvoices: any[]
  }) => {
    const res = await apiClient.post("/api/v1/gst-reconciliation/run", payload)
    return res.data
  },

  getRuns: async (period?: string, latestOnly: boolean = true) => {
    const params = new URLSearchParams()
    if (period) params.append("period", period)
    params.append("latestOnly", String(latestOnly))
    const res = await apiClient.get(`/api/v1/gst-reconciliation/runs?${params.toString()}`)
    return res.data
  },

  getRunDetails: async (runId: string) => {
    const res = await apiClient.get(`/api/v1/gst-reconciliation/runs/${runId}`)
    return res.data
  },

  overrideItemStatus: async (itemId: string, matchStatus: string, reasoning: string) => {
    const res = await apiClient.patch(`/api/v1/gst-reconciliation/items/${itemId}/override`, {
      matchStatus,
      reasoning,
    })
    return res.data
  },

  notifyVendors: async (reconciliationRunId: string) => {
    const res = await apiClient.post("/api/v1/gst-reconciliation/notify-vendors", { reconciliationRunId })
    return res.data
  },

  updateSettings: async (settings: { isAutoPaymentBlockEnabled: boolean; canonicalToleranceAmount?: number }) => {
    const res = await apiClient.patch("/api/v1/gst-reconciliation/settings", settings)
    return res.data
  },
}
