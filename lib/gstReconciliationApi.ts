import { apiClient } from "@/lib/apiClient"

export interface GstReconciliationRun {
  id: string
  company_id: string
  financial_period: string
  gstr_type: string
  total_books_invoices: number
  total_matched: number
  total_mismatched: number
  total_itc_claimed: number
  total_itc_blocked: number
  status: string
  is_latest: boolean
  version?: number
  created_at: string
}

export interface GstReconciliationItem {
  id: string
  reconciliation_run_id: string
  supplier_gstin: string
  supplier_name: string
  invoice_number_books: string
  invoice_number_portal: string
  taxable_value_books: number
  taxable_value_portal: number
  cgst_books: number
  cgst_portal: number
  sgst_books: number
  sgst_portal: number
  igst_books: number
  igst_portal: number
  invoice_date_books: string
  invoice_date_portal: string
  confidence_score: number
  match_status: "exact_match" | "fuzzy_match" | "tax_mismatch" | "missing_in_gstr" | "missing_in_books" | "manual_override"
  variance_amount: number
  is_itc_eligible: boolean
  ai_match_reasoning: string
}

export const gstReconciliationApi = {
  requestGspOtp: async (gstin: string, username: string) => {
    return await apiClient("/api/v1/gst-reconciliation/asp/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gstin, username }),
    })
  },

  verifyGspOtp: async (sessionKey: string, otp: string) => {
    return await apiClient("/api/v1/gst-reconciliation/asp/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionKey, otp }),
    })
  },

  executeReconciliationRun: async (financialPeriod: string, booksInvoices: any[]) => {
    return await apiClient("/api/v1/gst-reconciliation/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financialPeriod, booksInvoices }),
    })
  },

  triggerRun: async (data: { financialPeriod: string; gstrType?: string; booksInvoices?: any[]; portalInvoices?: any[] }) => {
    return await apiClient("/api/v1/gst-reconciliation/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  },

  getLatestRun: async (period?: string) => {
    const url = period ? `/api/v1/gst-reconciliation/runs?period=${period}` : "/api/v1/gst-reconciliation/runs"
    return await apiClient(url)
  },

  getRuns: async (period?: string, latestOnly?: boolean) => {
    const params = new URLSearchParams()
    if (period) params.append("period", period)
    if (latestOnly !== undefined) params.append("latestOnly", String(latestOnly))
    const query = params.toString() ? `?${params.toString()}` : ""
    return await apiClient(`/api/v1/gst-reconciliation/runs${query}`)
  },

  getRunDetails: async (runId: string) => {
    return await apiClient(`/api/v1/gst-reconciliation/runs/${runId}`)
  },

  manualOverrideMatch: async (itemId: string, matchStatus: string, notes?: string) => {
    return await apiClient("/api/v1/gst-reconciliation/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, matchStatus, notes }),
    })
  },

  overrideItemStatus: async (itemId: string, matchStatus: string, notes?: string) => {
    return await apiClient("/api/v1/gst-reconciliation/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, matchStatus, notes }),
    })
  },

  notifyVendors: async (runId: string) => {
    return await apiClient(`/api/v1/gst-reconciliation/runs/${runId}/notify-vendors`, {
      method: "POST",
    })
  },

  updateSettings: async (settings: { isAutoPaymentBlockEnabled?: boolean; canonicalToleranceAmount?: number }) => {
    return await apiClient("/api/v1/gst-reconciliation/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
  },

  sendWhatsAppReminder: async (supplierGstin: string, supplierName: string, phone: string) => {
    return await apiClient("/api/v1/gst-reconciliation/send-whatsapp-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierGstin, supplierName, phone }),
    })
  },
}
