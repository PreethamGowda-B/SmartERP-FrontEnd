import { apiClient } from "@/lib/apiClient"

export interface ArAgingSummary {
  current_amount: number | string
  bucket_1_30: number | string
  bucket_31_60: number | string
  bucket_61_90: number | string
  bucket_90_plus: number | string
  total_active_schedules: number
}

export interface ArSchedule {
  id: string
  company_id: string
  invoice_id: number
  customer_id?: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  invoice_amount: number | string
  amount_outstanding: number | string
  due_date: string
  current_stage: "pre_due_3d" | "due_1d" | "overdue_7d" | "overdue_14d" | "overdue_30d" | "settled" | "paused"
  next_scheduled_reminder: string
  is_paused: boolean
  created_at: string
}

export const arCollectionsApi = {
  getSummary: async () => {
    return await apiClient("/api/v1/ar-collections/summary")
  },

  syncInvoices: async () => {
    return await apiClient("/api/v1/ar-collections/sync", {
      method: "POST",
    })
  },

  getSchedules: async (stage?: string, paused?: boolean) => {
    const params = new URLSearchParams()
    if (stage) params.append("stage", stage)
    if (paused !== undefined) params.append("paused", String(paused))
    const query = params.toString() ? `?${params.toString()}` : ""
    return await apiClient(`/api/v1/ar-collections/schedules${query}`)
  },

  dispatchReminder: async (scheduleId: string, channel: string = "whatsapp") => {
    return await apiClient("/api/v1/ar-collections/dispatch-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId, channel }),
    })
  },

  pauseSchedule: async (scheduleId: string) => {
    return await apiClient(`/api/v1/ar-collections/schedules/${scheduleId}/pause`, {
      method: "PATCH",
    })
  },

  resumeSchedule: async (scheduleId: string) => {
    return await apiClient(`/api/v1/ar-collections/schedules/${scheduleId}/resume`, {
      method: "PATCH",
    })
  },

  generatePaymentPlanOffer: async (data: { customerName: string; outstandingAmount: number; overdueDays: number }) => {
    return await apiClient("/api/v1/ar-collections/payment-plan-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  },
}
