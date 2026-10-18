import { apiClient } from "@/lib/apiClient"

export type ProductionStatus =
  | "planned"
  | "in_production"
  | "quality_check"
  | "ready_for_dispatch"
  | "partially_dispatched"
  | "dispatched"
  | "on_hold"
  | "rework_required"
  | "rejected"
  | "cancelled"

export interface ProductionOrder {
  id: string
  orderNumber: string
  customerName: string
  customerOrderReference?: string | null
  componentName: string
  partNumber: string
  drawingNumber?: string | null
  drawingRevision?: string | null
  plannedQuantity: number
  unit: string
  goodQuantity: number
  rejectedQuantity: number
  reworkQuantity: number
  acceptedQuantity: number
  dispatchedQuantity: number
  outstandingQuantity: number
  machineName?: string | null
  assignedEmployeeName?: string | null
  assignedEmployeeId?: string | null
  activeBatchId?: string | null
  activeBatchHasReport?: boolean
  status: ProductionStatus
  priority: "low" | "medium" | "high" | "urgent"
  dueDate?: string | null
  updatedAt: string
}

export interface ProductionDashboard {
  counts: Partial<Record<ProductionStatus, number>>
  overdueCount: number
  rejectedQuantity: number
  reworkQuantity: number
}

export interface ProductionReferences {
  customers: Array<{ id: string; name: string }>
  machines: Array<{ id: string; name: string }>
  employees: Array<{ id: string; name: string }>
  inventoryItems: Array<{ id: string; name: string; unit?: string | null }>
  jobs: Array<{ id: string; title: string; customerName?: string | null }>
}

export interface ProductionOrderDraft {
  customerId: string
  customerOrderReference?: string
  componentName: string
  partNumber: string
  drawingNumber?: string
  drawingRevision?: string
  plannedQuantity: number
  unit: string
  dueDate: string
  priority: "low" | "medium" | "high" | "urgent"
  machineId?: string
  assignedEmployeeId?: string
  instructions?: string
  jobId?: string
  materials?: Array<{ inventoryItemId: string; plannedQuantity: number; unit?: string }>
}

export interface PlannedMaterialLine {
  inventoryItemId: string
  plannedQuantity: number
  unit?: string
}

export class ProductionApiUnavailableError extends Error {
  constructor() {
    super("The Production & Dispatch API is not active yet. No production data or actions were simulated.")
    this.name = "ProductionApiUnavailableError"
  }
}

function unwrap<T>(response: any): T {
  if (response?.success === false) {
    throw new Error(response.message || "The production request could not be completed.")
  }
  return (response?.data ?? response) as T
}

function normalizeApiError(error: any): Error {
  if (error?.status === 404 || error?.status === 501 || error?.status === 503) {
    return new ProductionApiUnavailableError()
  }
  return new Error(error?.message || "Unable to reach the production service. Please retry.")
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await apiClient<any>(path, options)
    return unwrap<T>(response)
  } catch (error) {
    throw normalizeApiError(error)
  }
}

export async function getProductionDashboard() {
  return request<ProductionDashboard>("/api/production/dashboard")
}

export async function getProductionOrders(params: { q?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value))
  }
  const suffix = query.size ? `?${query.toString()}` : ""
  return request<{ orders: ProductionOrder[]; page: number; pageSize: number; total: number }>(`/api/production/orders${suffix}`)
}

export async function getProductionReferences() {
  return request<ProductionReferences>("/api/production/references")
}

export async function createProductionOrder(payload: ProductionOrderDraft) {
  return request<{ order: ProductionOrder }>("/api/production/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(payload),
  })
}

export async function getMyProductionOrders() {
  return request<{ orders: ProductionOrder[] }>("/api/production/my-orders")
}

export async function startProductionOrder(orderId: string) {
  return request<{ batchId: string; startedAt: string }>(`/api/production/orders/${encodeURIComponent(orderId)}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({}),
  })
}

export async function reportProductionBatch(batchId: string, payload: { goodQuantity: number; rejectedQuantity: number; reworkQuantity: number; notes?: string }) {
  return request<{ report: { id: string; reportedAt: string } }>(`/api/production/batches/${encodeURIComponent(batchId)}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(payload),
  })
}

export async function submitBatchForInspection(batchId: string) {
  return request<{ submittedAt: string }>(`/api/production/batches/${encodeURIComponent(batchId)}/submit-quality`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({}),
  })
}
