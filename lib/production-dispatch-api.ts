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
  machineId?: string | null
  assignedEmployeeName?: string | null
  assignedEmployeeId?: string | null
  activeBatchId?: string | null
  dispatchEmployeeId?: string | null
  dispatchEmployeeName?: string | null
  isAssignedOperator?: boolean
  isAssignedDispatcher?: boolean
  inspections?: ProductionOrderDetail["inspections"]
  packingRecords?: ProductionOrderDetail["packingRecords"]
  activeBatchHasReport?: boolean
  latestInspectionResult?: string | null
  latestInspectionReason?: string | null
  latestInspectionAt?: string | null
  status: ProductionStatus
  priority: "low" | "medium" | "high" | "urgent"
  dueDate?: string | null
  updatedAt: string
}

export interface ProductionOrderDetail {
  order: ProductionOrder
  batches: Array<{
    id: string
    batch_number: number
    operator_id: string
    status: string
    started_at: string
    submitted_at?: string | null
    completed_at?: string | null
    good_quantity: number
    rejected_quantity: number
    rework_quantity: number
  }>
  reports: Array<{
    id: string
    batch_id: string
    reported_by_name: string
    good_quantity: number
    rejected_quantity: number
    rework_quantity: number
    notes?: string | null
    reported_at: string
  }>
  materials: Array<{ id: string; item_name: string; planned_quantity: number; unit?: string | null }>
  inspections: Array<{
    id: string
    inspection_reference: string
    submitted_quantity: number
    accepted_quantity: number
    rejected_quantity: number
    rework_quantity: number
    result: string
    reason?: string | null
    inspector_name: string
    inspected_at: string
  }>
  dispatches: Array<{
    id: string
    packing_record_id?: string | null
    dispatch_reference: string
    quantity: number
    delivery_reference?: string | null
    carrier?: string | null
    confirmed_by_name: string
    dispatched_at: string
  }>
  packingRecords: Array<{
    id: string
    inspection_id: string
    quantity: number
    package_count: number
    package_type?: string | null
    status: "packing" | "packed" | "ready_for_dispatch"
    notes?: string | null
    recorded_by_name: string
    created_at: string
    updated_at: string
    dispatched_quantity: number
    remaining_quantity: number
  }>
  events: Array<{
    id: string
    event_type: string
    actor_name: string
    from_status?: string | null
    to_status?: string | null
    quantity?: number | null
    reason?: string | null
    details: Record<string, unknown>
    created_at: string
  }>
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
  dispatchEmployeeId?: string
  instructions?: string
  jobId?: string
  materials?: Array<{ inventoryItemId: string; plannedQuantity: number; unit?: string }>
}

export interface ProductionInspectionRecord {
  id: string
  inspection_reference: string
  submitted_quantity: number
  accepted_quantity: number
  rejected_quantity: number
  rework_quantity: number
  result: string
  reason?: string | null
  inspector_name: string
  inspected_at: string
}

export interface PlannedMaterialLine {
  inventoryItemId: string
  plannedQuantity: number
  unit?: string
}

export class ProductionApiUnavailableError extends Error {
  constructor(message = "Production & Dispatch is unavailable in this deployment. No production data or actions were simulated.") {
    super(message)
    this.name = "ProductionApiUnavailableError"
  }
}

// Keep the same key when the client retries the same mutation after a lost
// response. A changed payload gets a different key; successful calls release it.
const pendingMutationKeys = new Map<string, string>()
const MUTATION_STORAGE_PREFIX = "smarterp-production-mutation:"

function unwrap<T>(response: any): T {
  if (response?.success === false) {
    throw new Error(response.message || "The production request could not be completed.")
  }
  return (response?.data ?? response) as T
}

function normalizeApiError(error: any): Error {
  if (error?.status === 404) return new ProductionApiUnavailableError("This backend deployment does not expose the Production & Dispatch API yet. No sample production data is shown.")
  if (error?.status === 501) return new ProductionApiUnavailableError("Production & Dispatch is not enabled in this deployment. No sample production data is shown.")
  if (error?.status === 503) return new ProductionApiUnavailableError(error?.message || "Production & Dispatch storage or database permissions are not active. No sample production data is shown.")
  const normalized = new Error(error?.message || "Unable to reach the production service. Please retry.")
  ;(normalized as Error & { status?: number }).status = error?.status
  return normalized
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await apiClient<any>(path, options)
    return unwrap<T>(response)
  } catch (error) {
    throw normalizeApiError(error)
  }
}

async function mutateRequest<T>(scope: string, path: string, payload: unknown, method = "POST"): Promise<T> {
  const body = JSON.stringify(payload)
  const signature = `${scope}:${body}`
  const fingerprintBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signature))
  const fingerprint = Array.from(new Uint8Array(fingerprintBytes), (value) => value.toString(16).padStart(2, "0")).join("")
  const storageKey = `${MUTATION_STORAGE_PREFIX}${fingerprint}`
  let key = pendingMutationKeys.get(signature)
  if (!key) {
    try { key = window.localStorage.getItem(storageKey) || undefined } catch { key = undefined }
  }
  key ||= crypto.randomUUID()
  pendingMutationKeys.set(signature, key)
  try { window.localStorage.setItem(storageKey, key) } catch {}
  try {
    const result = await request<T>(path, {
      method,
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body,
    })
    pendingMutationKeys.delete(signature)
    try { window.localStorage.removeItem(storageKey) } catch {}
    return result
  } catch (error) {
    if (typeof (error as Error & { status?: number }).status === "number" && (error as Error & { status: number }).status < 500) {
      pendingMutationKeys.delete(signature)
      try { window.localStorage.removeItem(storageKey) } catch {}
    }
    throw error
  }
}

export async function getProductionDashboard() {
  return request<ProductionDashboard>("/api/production/dashboard")
}

export async function getProductionReports(params: { from?: string; to?: string } = {}) {
  const query = new URLSearchParams()
  if (params.from) query.set("from", params.from)
  if (params.to) query.set("to", params.to)
  const suffix = query.size ? `?${query.toString()}` : ""
  return request<{
    from: string | null
    to: string | null
    production: { reportCount: number; goodQuantity: number; rejectedQuantity: number; reworkQuantity: number; rejectRate: number }
    quality: { inspectionCount: number; acceptedQuantity: number; rejectedQuantity: number; reworkQuantity: number }
    dispatch: { dispatchCount: number; dispatchedQuantity: number }
    outstanding: { orderCount: number; acceptedQuantity: number }
  }>(`/api/production/reports${suffix}`)
}

export async function getProductionOrders(params: { q?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value))
  }
  const suffix = query.size ? `?${query.toString()}` : ""
  return request<{ orders: ProductionOrder[]; page: number; pageSize: number; total: number }>(`/api/production/orders${suffix}`)
}

export async function getProductionOrder(orderId: string) {
  return request<ProductionOrderDetail>(`/api/production/orders/${encodeURIComponent(orderId)}`)
}

export async function getProductionReferences() {
  return request<ProductionReferences>("/api/production/references")
}

export async function createProductionOrder(payload: ProductionOrderDraft) {
  return mutateRequest<{ order: ProductionOrder }>("create-production-order", "/api/production/orders", payload)
}

export async function updateProductionAssignments(orderId: string, payload: { assignedEmployeeId?: string | null; dispatchEmployeeId?: string | null; machineId?: string | null; reason: string }) {
  return mutateRequest<{ order: ProductionOrder }>(`assign-production:${orderId}`, `/api/production/orders/${encodeURIComponent(orderId)}/assignments`, payload)
}

export async function createProductionPackingRecord(orderId: string, payload: { inspectionId: string; quantity: number; packageCount: number; packageType?: string; notes?: string }) {
  return mutateRequest<{ packingRecord: ProductionOrderDetail["packingRecords"][number]; remainingPackableQuantity: number }>(`production-packing:${orderId}`, `/api/production/orders/${encodeURIComponent(orderId)}/packing-records`, payload)
}

export async function advanceProductionPacking(packingId: string, status: "packed" | "ready_for_dispatch") {
  return mutateRequest<{ packingRecord: { id: string; status: string; updated_at: string } }>(`packing-status:${packingId}`, `/api/production/packing-records/${encodeURIComponent(packingId)}/status`, { status }, "PATCH")
}

export async function getMyProductionOrders() {
  return request<{ orders: ProductionOrder[] }>("/api/production/my-orders")
}

export async function startProductionOrder(orderId: string) {
  return mutateRequest<{ batchId: string; startedAt: string }>(`start-production:${orderId}`, `/api/production/orders/${encodeURIComponent(orderId)}/start`, {})
}

export async function reportProductionBatch(batchId: string, payload: { goodQuantity: number; rejectedQuantity: number; reworkQuantity: number; notes?: string }) {
  return mutateRequest<{ report: { id: string; reportedAt: string } }>(`production-report:${batchId}`, `/api/production/batches/${encodeURIComponent(batchId)}/reports`, payload)
}

export async function submitBatchForInspection(batchId: string) {
  return mutateRequest<{ submittedAt: string }>(`submit-quality:${batchId}`, `/api/production/batches/${encodeURIComponent(batchId)}/submit-quality`, {})
}

export async function inspectProductionBatch(batchId: string, payload: {
  acceptedQuantity: number
  rejectedQuantity: number
  reworkQuantity: number
  reason?: string
  notes?: string
}) {
  return mutateRequest<{ inspection: { id: string; reference: string; inspectedAt: string; result: string } }>(`inspect-batch:${batchId}`, `/api/production/batches/${encodeURIComponent(batchId)}/inspections`, payload)
}

export async function confirmProductionDispatch(orderId: string, payload: {
  packingRecordId: string
  quantity: number
  confirmed: true
  deliveryReference?: string
  carrier?: string
  transportDetails?: string
  notes?: string
}) {
  return mutateRequest<{ dispatch: { id: string; reference: string; quantity: number; dispatchedAt: string; remainingAcceptedQuantity: number } }>(`dispatch-order:${orderId}`, `/api/production/orders/${encodeURIComponent(orderId)}/dispatches`, payload)
}
