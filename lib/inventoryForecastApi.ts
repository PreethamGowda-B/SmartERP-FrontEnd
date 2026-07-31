import { apiClient } from "@/lib/apiClient"

export interface InventoryForecast {
  id: string
  company_id: string
  item_id: number
  item_name: string
  current_quantity: number | string
  unit: string
  category: string
  daily_usage_rate: number | string
  safety_stock: number | string
  reorder_point: number | string
  economic_order_quantity: number | string
  predicted_30d_demand: number | string
  is_rop_breached: boolean
  last_calculated_at: string
}

export interface InventorySupplier {
  id: string
  company_id: string
  supplier_name: string
  contact_person?: string
  email: string
  phone?: string
  address?: string
  gstin?: string
  default_lead_time_days: number
  rating: number | string
}

export interface PurchaseOrder {
  id: string
  company_id: string
  supplier_id: string
  supplier_name: string
  supplier_email: string
  creator_name?: string
  po_number: string
  status: "draft" | "pending_approval" | "sent_to_supplier" | "partially_received" | "completed" | "cancelled"
  total_amount: number | string
  is_ai_generated: boolean
  ai_generation_reasoning?: string
  created_at: string
}

export const inventoryForecastApi = {
  getForecasts: async () => {
    return await apiClient("/api/v1/inventory-forecast/forecasts")
  },

  recalculateForecasts: async () => {
    return await apiClient("/api/v1/inventory-forecast/forecasts/recalculate", {
      method: "POST",
    })
  },

  getSuppliers: async () => {
    return await apiClient("/api/v1/inventory-forecast/suppliers")
  },

  createSupplier: async (data: {
    supplierName: string
    contactPerson?: string
    email: string
    phone?: string
    address?: string
    gstin?: string
    defaultLeadTimeDays?: number
  }) => {
    return await apiClient("/api/v1/inventory-forecast/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  },

  getPurchaseOrders: async (status?: string) => {
    const query = status ? `?status=${status}` : ""
    return await apiClient(`/api/v1/inventory-forecast/purchase-orders${query}`)
  },

  createAgenticDraftPO: async (data: {
    supplierId: string
    itemsToReorder: Array<{ itemId: number; quantity: number; unitPrice: number }>
  }) => {
    return await apiClient("/api/v1/inventory-forecast/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  },

  approvePurchaseOrder: async (poId: string) => {
    return await apiClient(`/api/v1/inventory-forecast/purchase-orders/${poId}/approve`, {
      method: "PATCH",
    })
  },
}
