"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  createProductionOrder,
  createOrResumeProductionInvoiceDraft,
  getProductionDashboard,
  getProductionOrder,
  getProductionOrders,
  getProductionReferences,
  ProductionApiUnavailableError,
  ProductionDashboard,
  ProductionOrder,
  ProductionOrderDetail,
  ProductionOrderDraft,
  ProductionReferences,
  ProductionStatus,
  PlannedMaterialLine,
  inspectProductionBatch,
  confirmProductionDispatch,
  updateProductionAssignments,
  createProductionPackingRecord,
  advanceProductionPacking,
} from "@/lib/production-dispatch-api"
import { AlertTriangle, ClipboardCheck, Eye, Factory, Loader2, Plus, RefreshCw, Search, Truck, X } from "lucide-react"

const STATUS_CARDS: Array<{ status: ProductionStatus | "overdue" | "quality_loss"; label: string; color: string }> = [
  { status: "planned", label: "Planned", color: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-100" },
  { status: "in_production", label: "In production", color: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-200" },
  { status: "quality_check", label: "Quality check", color: "text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-200" },
  { status: "ready_for_dispatch", label: "Ready to dispatch", color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-200" },
  { status: "partially_dispatched", label: "Part dispatched", color: "text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-200" },
  { status: "dispatched", label: "Dispatched", color: "text-green-700 bg-green-50 dark:bg-green-950/40 dark:text-green-200" },
  { status: "overdue", label: "Overdue", color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-200" },
  { status: "quality_loss", label: "Rejected / rework", color: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-200" },
]

const STATUS_LABELS: Record<ProductionStatus, string> = {
  planned: "Planned", in_production: "In production", quality_check: "Quality check",
  ready_for_dispatch: "Ready for dispatch", partially_dispatched: "Partially dispatched",
  dispatched: "Dispatched", on_hold: "On hold", rework_required: "Rework required",
  rejected: "Rejected", cancelled: "Cancelled",
}

const emptyDraft: ProductionOrderDraft = {
  customerId: "", customerOrderReference: "", componentName: "", partNumber: "",
  drawingNumber: "", drawingRevision: "", plannedQuantity: 1, unit: "pieces", dueDate: "",
  priority: "medium", machineId: "", assignedEmployeeId: "", dispatchEmployeeId: "", instructions: "", jobId: "",
}

export default function OwnerProductionPage() {
  const [dashboard, setDashboard] = useState<ProductionDashboard | null>(null)
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [references, setReferences] = useState<ProductionReferences | null>(null)
  const [referencesLoading, setReferencesLoading] = useState(false)
  const [draft, setDraft] = useState<ProductionOrderDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [materialLines, setMaterialLines] = useState<PlannedMaterialLine[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<ProductionOrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [actionBusy, setActionBusy] = useState(false)
  const [workflowNotice, setWorkflowNotice] = useState("")
  const [inspectionBatchId, setInspectionBatchId] = useState("")
  const [inspectionForm, setInspectionForm] = useState({ accepted: "0", rejected: "0", rework: "0", reason: "" })
  const [dispatchForm, setDispatchForm] = useState({ packingRecordId: "", quantity: "", deliveryReference: "", carrier: "", transportDetails: "" })
  const [dispatchAssignment, setDispatchAssignment] = useState("")
  const [packingForm, setPackingForm] = useState({ inspectionId: "", quantity: "", packageCount: "1", packageType: "" })
  const [dispatchConfirmOpen, setDispatchConfirmOpen] = useState(false)
  const [sourceManufacturingRequestId, setSourceManufacturingRequestId] = useState("")

  const load = useCallback(async (nextPage = page, nextStatus = status, search = query) => {
    setLoading(true)
    setError("")
    try {
      const [summary, result] = await Promise.all([
        getProductionDashboard(),
        getProductionOrders({ page: nextPage, pageSize, status: nextStatus, q: search.trim() }),
      ])
      setDashboard(summary)
      setOrders(result.orders || [])
      setTotal(Number(result.total) || 0)
      setPage(Number(result.page) || nextPage)
    } catch (cause: any) {
      setError(cause instanceof ProductionApiUnavailableError
        ? cause.message
        : cause?.message || "Unable to load production orders.")
      setDashboard(null)
      setOrders([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, query, status])

  useEffect(() => { void load(1, "", "") }, [load])

  const openCreate = async () => {
    setShowCreate(true)
    setFormError("")
    if (references) return
    setReferencesLoading(true)
    try {
      setReferences(await getProductionReferences())
    } catch (cause: any) {
      setFormError(cause?.message || "Production reference data is not available yet.")
    } finally {
      setReferencesLoading(false)
    }
  }

  useEffect(() => {
    const requestId = new URLSearchParams(window.location.search).get("manufacturingRequestId")
    if (!requestId || sourceManufacturingRequestId === requestId) return
    let cancelled = false
    void (async () => {
      setFormError("")
      setReferencesLoading(true)
      setShowCreate(true)
      try {
        const [requestResponse, refs] = await Promise.all([
          import("@/lib/apiClient").then(({ apiClient }) => apiClient(`/api/v1/customer-manufacturing-requests/${encodeURIComponent(requestId)}`)),
          getProductionReferences(),
        ])
        if (cancelled) return
        const request = requestResponse?.data?.request
        if (!request || !["approved", "production_scheduled"].includes(request.status)) throw new Error("Only an approved manufacturing request can start a production order.")
        if (request.production_order_id) throw new Error("This request already has a linked production order. Open it from the production register instead.")
        setReferences(refs)
        setSourceManufacturingRequestId(requestId)
        setDraft({
          ...emptyDraft,
          customerId: String(request.customer_id),
          customerOrderReference: request.request_reference,
          componentName: request.component_name || "",
          partNumber: request.part_number || "",
          drawingNumber: request.drawing_number || "",
          drawingRevision: request.drawing_revision || "",
          plannedQuantity: Number(request.requested_quantity),
          unit: request.unit || "pieces",
          dueDate: String(request.confirmed_due_date || request.requested_completion_date || "").slice(0, 10),
          instructions: [request.description, request.material_specification && `Material: ${request.material_specification}`, request.dimensions && `Dimensions: ${request.dimensions}`, request.tolerance && `Tolerance: ${request.tolerance}`, request.finish && `Finish: ${request.finish}`, request.instructions].filter(Boolean).join("\n\n"),
        })
      } catch (cause: any) {
        if (!cancelled) setFormError(cause?.message || "Unable to prepare a production order from this request.")
      } finally { if (!cancelled) setReferencesLoading(false) }
    })()
    return () => { cancelled = true }
  }, [sourceManufacturingRequestId])

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError("")
    setSaving(true)
    try {
      const created = await createProductionOrder({
        ...draft,
        plannedQuantity: Number(draft.plannedQuantity),
        customerOrderReference: draft.customerOrderReference?.trim() || undefined,
        drawingNumber: draft.drawingNumber?.trim() || undefined,
        drawingRevision: draft.drawingRevision?.trim() || undefined,
        machineId: draft.machineId || undefined,
        assignedEmployeeId: draft.assignedEmployeeId || undefined,
        instructions: draft.instructions?.trim() || undefined,
        jobId: draft.jobId || undefined,
        materials: materialLines.filter((line) => line.inventoryItemId && Number(line.plannedQuantity) > 0),
      })
      let linkWarning = ""
      if (sourceManufacturingRequestId && created?.order?.id) {
        try {
          const { apiClient } = await import("@/lib/apiClient")
          const linked = await apiClient(`/api/v1/customer-manufacturing-requests/${encodeURIComponent(sourceManufacturingRequestId)}/link-production-order`, {
            method: "POST", body: JSON.stringify({ productionOrderId: created.order.id }),
          })
          if (!linked?.success) throw new Error(linked?.error || "The production order was created, but the customer request link was not confirmed.")
        } catch (cause: any) {
          linkWarning = `Production order ${created.order.orderNumber || created.order.id} was created, but request linking failed: ${cause?.message || "please link it from Manufacturing Requests."}`
        }
      }
      if (sourceManufacturingRequestId) window.history.replaceState({}, "", "/owner/production")
      setShowCreate(false)
      setDraft(emptyDraft)
      setMaterialLines([])
      setSourceManufacturingRequestId("")
      if (linkWarning) setError(linkWarning)
      await load(1, status, query)
    } catch (cause: any) {
      setFormError(cause?.message || "The production order could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  const applyStatus = (value: string) => {
    const nextStatus = value === status ? "" : value
    setStatus(nextStatus)
    setPage(1)
    void load(1, nextStatus, query)
  }

  const getCardValue = (key: string) => {
    if (!dashboard) return "—"
    if (key === "overdue") return dashboard.overdueCount
    if (key === "quality_loss") return `${dashboard.rejectedQuantity} / ${dashboard.reworkQuantity}`
    return dashboard.counts[key as ProductionStatus] ?? 0
  }

  const openDetails = async (orderId: string) => {
    setDetailOpen(true)
    setDetail(null)
    setDetailError("")
    setWorkflowNotice("")
    setDetailLoading(true)
    try {
      const orderDetail = await getProductionOrder(orderId)
      setDetail(orderDetail)
      setDispatchAssignment(orderDetail.order.dispatchEmployeeId || "")
      setPackingForm({ inspectionId: orderDetail.inspections.find((inspection) => Number(inspection.accepted_quantity) > 0)?.id || "", quantity: "", packageCount: "1", packageType: "" })
      if (!references) getProductionReferences().then(setReferences).catch(() => {})
    }
    catch (cause: any) { setDetailError(cause?.message || "Unable to load production history.") }
    finally { setDetailLoading(false) }
  }

  const reloadDetails = async () => {
    if (!detail?.order.id) return
    setDetailLoading(true)
    try { setDetail(await getProductionOrder(detail.order.id)); await load() }
    catch (cause: any) { setDetailError(cause?.message || "Unable to refresh production history.") }
    finally { setDetailLoading(false) }
  }

  const submitInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!inspectionBatchId || !detail) return
    setActionBusy(true); setDetailError(""); setWorkflowNotice("")
    try {
      const result = await inspectProductionBatch(inspectionBatchId, {
        acceptedQuantity: Number(inspectionForm.accepted), rejectedQuantity: Number(inspectionForm.rejected),
        reworkQuantity: Number(inspectionForm.rework), reason: inspectionForm.reason.trim() || undefined,
      })
      setWorkflowNotice(`Inspection ${result.inspection.reference} saved: ${result.inspection.result}.`)
      setInspectionBatchId("")
      await reloadDetails()
    } catch (cause: any) { setDetailError(cause?.message || "Inspection could not be saved.") }
    finally { setActionBusy(false) }
  }

  const submitDispatch = async () => {
    if (!detail) return
    setActionBusy(true); setDetailError(""); setWorkflowNotice("")
    try {
      const result = await confirmProductionDispatch(detail.order.id, {
        packingRecordId: dispatchForm.packingRecordId,
        quantity: Number(dispatchForm.quantity), confirmed: true,
        deliveryReference: dispatchForm.deliveryReference.trim() || undefined,
        carrier: dispatchForm.carrier.trim() || undefined,
        transportDetails: dispatchForm.transportDetails.trim() || undefined,
      })
      setDispatchConfirmOpen(false)
      setWorkflowNotice(`Dispatch ${result.dispatch.reference} confirmed for ${result.dispatch.quantity} ${detail.order.unit} at ${new Date(result.dispatch.dispatchedAt).toLocaleString()}.`)
      setDispatchForm({ packingRecordId: "", quantity: "", deliveryReference: "", carrier: "", transportDetails: "" })
      await reloadDetails()
    } catch (cause: any) { setDetailError(cause?.message || "Dispatch could not be confirmed.") }
    finally { setActionBusy(false) }
  }

  const openInvoiceEditor = async () => {
    if (!detail?.order) return
    setActionBusy(true)
    setDetailError("")
    try {
      await createOrResumeProductionInvoiceDraft(detail.order.id)
      window.location.assign(`/owner/jobs/${encodeURIComponent(detail.order.id)}/invoice-editor?source=production&productionOrderId=${encodeURIComponent(detail.order.id)}`)
    } catch (cause: any) {
      setDetailError(cause?.message || "Unable to create or resume the production invoice draft.")
    } finally {
      setActionBusy(false)
    }
  }

  const saveDispatchAssignment = async () => {
    if (!detail) return
    setActionBusy(true); setDetailError(""); setWorkflowNotice("")
    try {
      await updateProductionAssignments(detail.order.id, { assignedEmployeeId: detail.order.assignedEmployeeId || null, dispatchEmployeeId: dispatchAssignment || null, machineId: detail.order.machineId || null, reason: "Dispatch responsibility updated by owner" })
      setWorkflowNotice("Dispatch employee assignment saved.")
      await reloadDetails()
    } catch (cause: any) { setDetailError(cause?.message || "Dispatch employee assignment could not be saved.") }
    finally { setActionBusy(false) }
  }

  const submitPackingRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detail) return
    setActionBusy(true); setDetailError(""); setWorkflowNotice("")
    try {
      await createProductionPackingRecord(detail.order.id, { inspectionId: packingForm.inspectionId, quantity: Number(packingForm.quantity), packageCount: Number(packingForm.packageCount), packageType: packingForm.packageType.trim() || undefined })
      setWorkflowNotice("Packing record created. Advance it through Packed and Ready for dispatch when each step is complete.")
      setPackingForm({ ...packingForm, quantity: "", packageType: "" })
      await reloadDetails()
    } catch (cause: any) { setDetailError(cause?.message || "Packing record could not be saved.") }
    finally { setActionBusy(false) }
  }

  const advancePacking = async (recordId: string, next: "packed" | "ready_for_dispatch") => {
    setActionBusy(true); setDetailError(""); setWorkflowNotice("")
    try {
      await advanceProductionPacking(recordId, next)
      setWorkflowNotice(next === "packed" ? "Packing recorded as complete." : "Packing is ready for dispatch.")
      await reloadDetails()
    } catch (cause: any) { setDetailError(cause?.message || "Packing status could not be updated.") }
    finally { setActionBusy(false) }
  }

  return (
    <OwnerLayout>
      <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Factory className="h-4 w-4 text-primary" /> Operations / Manufacturing</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Production &amp; Dispatch</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track component production, inspection decisions, and partial shipments in one company-scoped register.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
            <Button onClick={() => void openCreate()}><Plus className="mr-2 h-4 w-4" />New production order</Button>
          </div>
        </div>

        {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

        <section aria-label="Production status summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-8">
          {STATUS_CARDS.map((card) => {
            const active = card.status !== "overdue" && card.status !== "quality_loss" && status === card.status
            return <button key={card.status} type="button" onClick={() => applyStatus(card.status)} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl" aria-pressed={active}>
              <Card className={`h-full transition-colors hover:border-primary/40 ${active ? "border-primary ring-1 ring-primary/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{card.label}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${card.color}`}>{card.status === "quality_loss" ? "QTY" : "ORDERS"}</span></div>
                  <div className="mt-3 text-2xl font-semibold tabular-nums">{loading && !dashboard ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted" /> : getCardValue(card.status)}</div>
                </CardContent>
              </Card>
            </button>
          })}
        </section>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Production register</CardTitle><p className="mt-1 text-sm text-muted-foreground">Search orders, parts, drawings, customers, and customer references.</p></div>
            <form className="flex w-full gap-2 sm:max-w-md" onSubmit={(event) => { event.preventDefault(); setPage(1); void load(1, status, query) }}>
              <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search production orders…" className="pl-9" aria-label="Search production orders" /></div>
              <Button type="submit" variant="secondary" disabled={loading}>Search</Button>
            </form>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="production-status">Status</label>
              <select id="production-status" className="h-9 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => applyStatus(event.target.value)}>
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <span className="ml-auto text-xs text-muted-foreground">{total ? `${total} orders` : ""}</span>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>
                  <th className="px-3 py-3">Order / customer</th><th className="px-3 py-3">Component</th><th className="px-3 py-3">Part / drawing</th><th className="px-3 py-3">Quantity</th><th className="px-3 py-3">Machine / operator</th><th className="px-3 py-3">Due date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Dispatch remaining</th><th className="px-3 py-3">History</th>
                </tr></thead>
                <tbody className="divide-y">
                  {loading && <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading production data…</td></tr>}
                  {!loading && !error && orders.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center"><Factory className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" /><p className="font-medium">No production orders yet</p><p className="mt-1 text-xs text-muted-foreground">Create a production order to start tracing manufacturing and dispatch.</p></td></tr>}
                  {!loading && orders.map((order) => <tr key={order.id} className="hover:bg-muted/30">
                    <td className="px-3 py-3"><div className="font-medium">{order.orderNumber}</div><div className="text-xs text-muted-foreground">{order.customerName}{order.customerOrderReference ? ` · ${order.customerOrderReference}` : ""}</div></td>
                    <td className="px-3 py-3 font-medium">{order.componentName}</td>
                    <td className="px-3 py-3"><div>{order.partNumber}</div><div className="text-xs text-muted-foreground">{order.drawingNumber || "No drawing"}{order.drawingRevision ? ` · Rev ${order.drawingRevision}` : ""}</div></td>
                    <td className="px-3 py-3 tabular-nums"><div>{order.goodQuantity} good / {order.plannedQuantity} {order.unit}</div><div className="text-xs text-muted-foreground">{order.rejectedQuantity} rejected · {order.reworkQuantity} rework</div></td>
                    <td className="px-3 py-3"><div>{order.machineName || "Unassigned machine"}</div><div className="text-xs text-muted-foreground">{order.assignedEmployeeName || "Unassigned operator"}</div></td>
                    <td className="px-3 py-3">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-3"><Badge variant="outline">{STATUS_LABELS[order.status] || order.status}</Badge></td>
                    <td className="px-3 py-3"><div className="flex items-center gap-2"><Truck className="h-4 w-4 text-muted-foreground" /><span className="tabular-nums">{order.outstandingQuantity} {order.unit}</span></div><div className="text-xs text-muted-foreground">{order.dispatchedQuantity} shipped</div></td>
                    <td className="px-3 py-3"><Button type="button" size="sm" variant="outline" onClick={() => void openDetails(order.id)}><Eye className="mr-1.5 h-3.5 w-3.5" />Details</Button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            {total > pageSize && <div className="mt-4 flex items-center justify-end gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>Previous</Button><span className="text-xs text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span><Button variant="outline" size="sm" disabled={page >= Math.ceil(total / pageSize) || loading} onClick={() => void load(page + 1)}>Next</Button></div>}
          </CardContent>
        </Card>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>Create production order</DialogTitle><DialogDescription>{sourceManufacturingRequestId ? "This order is being prepared from an approved customer manufacturing request. Review quantities and fill any required fields before saving." : "Customer, machine, employee, inventory, and job choices must come from this company’s verified records."}</DialogDescription></DialogHeader>
            {referencesLoading && <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading company references…</div>}
            {!referencesLoading && !references && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{formError || "Verified production reference data is unavailable. The order form is disabled."}</div>}
            {references && <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitOrder}>
              <label className="grid gap-1.5 text-sm sm:col-span-2">Customer *<select required disabled={Boolean(sourceManufacturingRequestId)} className="h-10 rounded-md border bg-background px-3 disabled:opacity-70" value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}><option value="">Choose a customer</option>{references.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm">Component name *<Input required disabled={Boolean(sourceManufacturingRequestId)} value={draft.componentName} onChange={(e) => setDraft({ ...draft, componentName: e.target.value })} maxLength={200} /></label>
              <label className="grid gap-1.5 text-sm">Part number *<Input required disabled={Boolean(sourceManufacturingRequestId)} value={draft.partNumber} onChange={(e) => setDraft({ ...draft, partNumber: e.target.value })} maxLength={100} /></label>
              <label className="grid gap-1.5 text-sm">Drawing number<Input disabled={Boolean(sourceManufacturingRequestId)} value={draft.drawingNumber} onChange={(e) => setDraft({ ...draft, drawingNumber: e.target.value })} maxLength={100} /></label>
              <label className="grid gap-1.5 text-sm">Drawing revision<Input disabled={Boolean(sourceManufacturingRequestId)} value={draft.drawingRevision} onChange={(e) => setDraft({ ...draft, drawingRevision: e.target.value })} maxLength={40} /></label>
              <label className="grid gap-1.5 text-sm">Planned quantity *<Input required disabled={Boolean(sourceManufacturingRequestId)} type="number" min="0.001" step="0.001" value={draft.plannedQuantity} onChange={(e) => setDraft({ ...draft, plannedQuantity: Number(e.target.value) })} /></label>
              <label className="grid gap-1.5 text-sm">Unit *<Input required value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} maxLength={24} /></label>
              <label className="grid gap-1.5 text-sm">Required completion date *<Input required type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /></label>
              <label className="grid gap-1.5 text-sm">Priority<select className="h-10 rounded-md border bg-background px-3" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as ProductionOrderDraft["priority"] })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              <label className="grid gap-1.5 text-sm">Machine / work centre<select className="h-10 rounded-md border bg-background px-3" value={draft.machineId} onChange={(e) => setDraft({ ...draft, machineId: e.target.value })}><option value="">Unassigned</option>{references.machines.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm">Assigned operator<select className="h-10 rounded-md border bg-background px-3" value={draft.assignedEmployeeId} onChange={(e) => setDraft({ ...draft, assignedEmployeeId: e.target.value })}><option value="">Unassigned</option>{references.employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm">Dispatch employee<select className="h-10 rounded-md border bg-background px-3" value={draft.dispatchEmployeeId} onChange={(e) => setDraft({ ...draft, dispatchEmployeeId: e.target.value })}><option value="">Assign later</option>{references.employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm">Customer order reference<Input value={draft.customerOrderReference} onChange={(e) => setDraft({ ...draft, customerOrderReference: e.target.value })} maxLength={120} /></label>
              <label className="grid gap-1.5 text-sm">Related service job<select className="h-10 rounded-md border bg-background px-3" value={draft.jobId} onChange={(e) => setDraft({ ...draft, jobId: e.target.value })}><option value="">No related service job</option>{references.jobs.map((item) => <option key={item.id} value={item.id}>{item.title}{item.customerName ? ` · ${item.customerName}` : ""}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm sm:col-span-2">Production instructions<textarea className="min-h-24 rounded-md border bg-background px-3 py-2" value={draft.instructions} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} maxLength={5000} /></label>
              <div className="grid gap-2 sm:col-span-2">
                <div className="flex items-center justify-between"><span className="text-sm font-medium">Planned materials <span className="font-normal text-muted-foreground">(planning only; does not change stock)</span></span><Button type="button" size="sm" variant="outline" onClick={() => setMaterialLines([...materialLines, { inventoryItemId: "", plannedQuantity: 1 }])} disabled={!references.inventoryItems.length}><Plus className="mr-1.5 h-3.5 w-3.5" />Add material</Button></div>
                {materialLines.map((line, index) => <div key={`${index}-${line.inventoryItemId}`} className="grid grid-cols-[minmax(0,1fr)_120px_40px] gap-2">
                  <select aria-label={`Material item ${index + 1}`} className="h-10 min-w-0 rounded-md border bg-background px-3 text-sm" value={line.inventoryItemId} onChange={(e) => { const item = references.inventoryItems.find((candidate) => candidate.id === e.target.value); setMaterialLines(materialLines.map((existing, row) => row === index ? { ...existing, inventoryItemId: e.target.value, unit: item?.unit || undefined } : existing)) }}><option value="">Choose stock item</option>{references.inventoryItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                  <Input aria-label={`Planned material quantity ${index + 1}`} type="number" min="0.001" step="0.001" value={line.plannedQuantity} onChange={(e) => setMaterialLines(materialLines.map((existing, row) => row === index ? { ...existing, plannedQuantity: Number(e.target.value) } : existing))} />
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove material ${index + 1}`} onClick={() => setMaterialLines(materialLines.filter((_, row) => row !== index))}><X className="h-4 w-4" /></Button>
                </div>)}
                {references.inventoryItems.length === 0 && <p className="text-xs text-muted-foreground">No inventory items are available in this company.</p>}
              </div>
              {formError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{formError}</p>}
              <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create order</Button></div>
            </form>}
          </DialogContent>
        </Dialog>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
            <DialogHeader><DialogTitle>Production order history</DialogTitle><DialogDescription>Persisted production, inspection, and dispatch records for this company order.</DialogDescription></DialogHeader>
            {detailLoading && <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading order history…</div>}
            {detailError && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{detailError}</div>}
            {workflowNotice && <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">{workflowNotice}</div>}
            {detail && <div className="space-y-5">
              <section className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div><p className="text-xs text-muted-foreground">Order / status</p><p className="mt-1 font-semibold">{detail.order.orderNumber} · {STATUS_LABELS[detail.order.status]}</p></div>
                <div><p className="text-xs text-muted-foreground">Component / part</p><p className="mt-1 font-semibold">{detail.order.componentName} · {detail.order.partNumber}</p></div>
                <div><p className="text-xs text-muted-foreground">Customer</p><p className="mt-1 font-semibold">{detail.order.customerName}{detail.order.customerOrderReference ? ` · ${detail.order.customerOrderReference}` : ""}</p></div>
                <div><p className="text-xs text-muted-foreground">Good / accepted / dispatched</p><p className="mt-1 font-semibold tabular-nums">{detail.order.goodQuantity} / {detail.order.acceptedQuantity} / {detail.order.dispatchedQuantity} {detail.order.unit}</p></div>
                <div><p className="text-xs text-muted-foreground">Machine / operator</p><p className="mt-1 font-semibold">{detail.order.machineName || "Unassigned"} / {detail.order.assignedEmployeeName || "Unassigned"}</p></div>
                <div><p className="text-xs text-muted-foreground">Dispatch employee</p><p className="mt-1 font-semibold">{detail.order.dispatchEmployeeName || "Not assigned"}</p></div>
                <div><p className="text-xs text-muted-foreground">Drawing</p><p className="mt-1 font-semibold">{detail.order.drawingNumber || "—"}{detail.order.drawingRevision ? ` · Rev ${detail.order.drawingRevision}` : ""}</p></div>
                <div><p className="text-xs text-muted-foreground">Due date</p><p className="mt-1 font-semibold">{detail.order.dueDate ? new Date(detail.order.dueDate).toLocaleDateString() : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Open accepted quantity</p><p className="mt-1 font-semibold tabular-nums">{detail.order.outstandingQuantity} {detail.order.unit}</p></div>
              </section>

              <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <h3 className="font-semibold">Invoice</h3>
                    {detail.order.invoice ? <p className="mt-1 text-sm text-muted-foreground">{detail.order.invoice.invoiceNumber} · {detail.order.invoice.status} · {new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(detail.order.invoice.amount)}{detail.order.invoice.issuedAt ? ` · ${new Date(detail.order.invoice.issuedAt).toLocaleString()}` : ""}</p> : <p className="mt-1 text-sm text-muted-foreground">Invoice is separate from dispatch. It will not update shipped quantity or production status.</p>}
                  </div>
                  {detail.order.invoice && detail.order.invoice.status !== "draft" ? <Button variant="outline" onClick={() => window.location.assign("/owner/finance/invoices")}>Open invoice list</Button> : <Button onClick={() => void openInvoiceEditor()} disabled={actionBusy || detail.order.status !== "ready_for_dispatch" || detail.order.acceptedQuantity < detail.order.plannedQuantity}>{actionBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{detail.order.invoice?.status === "draft" ? "Continue draft" : "Create invoice"}</Button>}
                </div>
                {detail.order.status === "ready_for_dispatch" && detail.order.acceptedQuantity < detail.order.plannedQuantity && <p className="mt-2 text-xs text-amber-700">The initial invoice workflow supports full-order invoicing only; the full order quantity must pass inspection first.</p>}
              </section>

              <section className="space-y-3 rounded-xl border p-4">
                <div><h3 className="font-semibold">Dispatch responsibility</h3><p className="text-xs text-muted-foreground">Only the assigned employee and Owner/Admin roles can record packing and dispatch for this company order.</p></div>
                <div className="flex flex-col gap-2 sm:flex-row"><select aria-label="Dispatch employee" className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" value={dispatchAssignment} onChange={(event) => setDispatchAssignment(event.target.value)}><option value="">No dispatch employee assigned</option>{references?.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select><Button type="button" variant="outline" onClick={() => void saveDispatchAssignment()} disabled={actionBusy}><ClipboardCheck className="mr-2 h-4 w-4" />Save assignment</Button></div>
              </section>

              <section className="space-y-2"><h3 className="flex items-center gap-2 font-semibold"><ClipboardCheck className="h-4 w-4 text-primary" />Batches and quality</h3>
                {detail.batches.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No production batches have been started.</p>}
                {detail.batches.map((batch) => <div key={batch.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div><p className="font-medium">Batch {batch.batch_number} · {batch.status.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">Started {new Date(batch.started_at).toLocaleString()} · {Number(batch.good_quantity)} good, {Number(batch.rejected_quantity)} rejected, {Number(batch.rework_quantity)} rework</p></div>
                  {batch.status === "submitted" && <Button size="sm" variant="outline" onClick={() => { const submitted = Number(batch.good_quantity) + Number(batch.rejected_quantity) + Number(batch.rework_quantity); setInspectionBatchId(batch.id); setInspectionForm({ accepted: String(batch.good_quantity), rejected: String(batch.rejected_quantity), rework: String(batch.rework_quantity), reason: "" }); if (!submitted) setDetailError("This batch has no quantity report to inspect.") }} disabled={actionBusy}>Inspect batch</Button>}
                </div>)}
                {inspectionBatchId && <form onSubmit={(event) => void submitInspection(event)} className="grid gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:grid-cols-3">
                  <p className="font-medium sm:col-span-3">Record inspection outcome</p>
                  <label className="grid gap-1 text-sm">Accepted<Input type="number" min="0" step="0.001" required value={inspectionForm.accepted} onChange={(event) => setInspectionForm({ ...inspectionForm, accepted: event.target.value })} /></label>
                  <label className="grid gap-1 text-sm">Rejected<Input type="number" min="0" step="0.001" required value={inspectionForm.rejected} onChange={(event) => setInspectionForm({ ...inspectionForm, rejected: event.target.value })} /></label>
                  <label className="grid gap-1 text-sm">Rework<Input type="number" min="0" step="0.001" required value={inspectionForm.rework} onChange={(event) => setInspectionForm({ ...inspectionForm, rework: event.target.value })} /></label>
                  <label className="grid gap-1 text-sm sm:col-span-3">Reason (required for reject or rework)<Input value={inspectionForm.reason} onChange={(event) => setInspectionForm({ ...inspectionForm, reason: event.target.value })} maxLength={2000} /></label>
                  <div className="flex justify-end gap-2 sm:col-span-3"><Button type="button" variant="ghost" onClick={() => setInspectionBatchId("")}>Cancel</Button><Button type="submit" disabled={actionBusy}>{actionBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save inspection</Button></div>
                </form>}
                {detail.inspections.map((inspection) => <div key={inspection.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{inspection.inspection_reference} · {inspection.result.replaceAll("_", " ")}</strong><span className="text-muted-foreground">{new Date(inspection.inspected_at).toLocaleString()} · {inspection.inspector_name}</span></div><p className="mt-1 text-muted-foreground">Accepted {inspection.accepted_quantity} · Rejected {inspection.rejected_quantity} · Rework {inspection.rework_quantity}{inspection.reason ? ` · ${inspection.reason}` : ""}</p></div>)}
              </section>

              <section className="space-y-2"><h3 className="font-semibold">Production reports</h3>{detail.reports.length === 0 && <p className="text-sm text-muted-foreground">No production quantities have been reported.</p>}{detail.reports.map((report) => <div key={report.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>Good {report.good_quantity} · Rejected {report.rejected_quantity} · Rework {report.rework_quantity}</strong><span className="text-muted-foreground">{report.reported_by_name} · {new Date(report.reported_at).toLocaleString()}</span></div>{report.notes && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{report.notes}</p>}</div>)}</section>

              <section className="space-y-2"><h3 className="font-semibold">Planned material requirements</h3><p className="text-xs text-muted-foreground">Planning references only. This workflow does not reserve, issue, consume, or decrement inventory.</p>{detail.materials.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No material requirements recorded.</p>}{detail.materials.map((material) => <div key={material.id} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm"><span className="font-medium">{material.item_name}</span><span className="tabular-nums text-muted-foreground">{material.planned_quantity} {material.unit || "units"}</span></div>)}</section>

              <section className="space-y-2"><h3 className="font-semibold">Dispatch history</h3>
                <div className="space-y-2 rounded-xl border p-4">
                  <div><h4 className="font-medium">Packing and readiness</h4><p className="text-xs text-muted-foreground">Packing quantities must come from accepted inspection lots. Each record advances from Packing → Packed → Ready for dispatch.</p></div>
                  <form onSubmit={(event) => void submitPackingRecord(event)} className="grid gap-2 sm:grid-cols-4">
                    <select required aria-label="Inspection lot to pack" className="h-10 rounded-md border bg-background px-3 text-sm sm:col-span-2" value={packingForm.inspectionId} onChange={(event) => setPackingForm({ ...packingForm, inspectionId: event.target.value })}><option value="">Select accepted inspection lot</option>{detail.inspections.filter((inspection) => Number(inspection.accepted_quantity) > 0).map((inspection) => <option key={inspection.id} value={inspection.id}>{inspection.inspection_reference} · {inspection.accepted_quantity} accepted</option>)}</select>
                    <Input required aria-label="Packing quantity" type="number" min="0.001" step="0.001" placeholder="Quantity" value={packingForm.quantity} onChange={(event) => setPackingForm({ ...packingForm, quantity: event.target.value })} />
                    <Input required aria-label="Package count" type="number" min="1" step="1" placeholder="Packages" value={packingForm.packageCount} onChange={(event) => setPackingForm({ ...packingForm, packageCount: event.target.value })} />
                    <Input aria-label="Package type" placeholder="Package type (optional)" maxLength={100} value={packingForm.packageType} onChange={(event) => setPackingForm({ ...packingForm, packageType: event.target.value })} className="sm:col-span-2" />
                    <Button type="submit" disabled={actionBusy || !packingForm.inspectionId || !Number(packingForm.quantity)} className="sm:col-span-2">Record packing</Button>
                  </form>
                  {detail.packingRecords.length === 0 && <p className="text-sm text-muted-foreground">No packing records yet.</p>}
                  {detail.packingRecords.map((record) => <div key={record.id} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{record.quantity} {detail.order.unit} · {record.package_count} package(s) {record.package_type ? `· ${record.package_type}` : ""}</p><p className="text-xs text-muted-foreground">{record.status.replaceAll("_", " ")} · {record.recorded_by_name} · {record.remaining_quantity} remaining</p></div><div className="flex flex-wrap gap-2">{record.status === "packing" && <Button size="sm" variant="outline" onClick={() => void advancePacking(record.id, "packed")} disabled={actionBusy}>Mark packed</Button>}{record.status === "packed" && <Button size="sm" onClick={() => void advancePacking(record.id, "ready_for_dispatch")} disabled={actionBusy}>Ready for dispatch</Button>}</div></div>)}
                </div>
                {detail.dispatches.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No dispatch has been confirmed.</p>}
                {detail.dispatches.map((dispatch) => <div key={dispatch.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{dispatch.dispatch_reference} · {dispatch.quantity} {detail.order.unit}</strong><span className="text-muted-foreground">{new Date(dispatch.dispatched_at).toLocaleString()} · {dispatch.confirmed_by_name}</span></div><p className="mt-1 text-muted-foreground">{[dispatch.delivery_reference, dispatch.carrier].filter(Boolean).join(" · ") || "No delivery reference recorded"}</p></div>)}
                {detail.order.outstandingQuantity > 0 && detail.order.acceptedQuantity > detail.order.dispatchedQuantity && <form onSubmit={(event) => { event.preventDefault(); setDispatchConfirmOpen(true) }} className="grid gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:grid-cols-2">
                  <p className="font-medium sm:col-span-2">Create a dispatch · {detail.order.outstandingQuantity} {detail.order.unit} accepted and not yet shipped</p>
                  <label className="grid gap-1 text-sm sm:col-span-2">Ready packing record<select required className="h-10 rounded-md border bg-background px-3" value={dispatchForm.packingRecordId} onChange={(event) => setDispatchForm({ ...dispatchForm, packingRecordId: event.target.value, quantity: "" })}><option value="">Choose packed quantity</option>{detail.packingRecords.filter((record) => record.status === "ready_for_dispatch" && Number(record.remaining_quantity) > 0).map((record) => <option key={record.id} value={record.id}>{record.quantity} {detail.order.unit} · {record.remaining_quantity} remaining · {record.package_type || record.id.slice(0, 8)}</option>)}</select></label>
                  <label className="grid gap-1 text-sm">Quantity to dispatch<Input required type="number" min="0.001" max={Math.min(detail.order.outstandingQuantity, Number(detail.packingRecords.find((record) => record.id === dispatchForm.packingRecordId)?.remaining_quantity || 0))} step="0.001" value={dispatchForm.quantity} onChange={(event) => setDispatchForm({ ...dispatchForm, quantity: event.target.value })} /></label>
                  <label className="grid gap-1 text-sm">Delivery reference<Input value={dispatchForm.deliveryReference} onChange={(event) => setDispatchForm({ ...dispatchForm, deliveryReference: event.target.value })} maxLength={120} /></label>
                  <label className="grid gap-1 text-sm">Carrier<Input value={dispatchForm.carrier} onChange={(event) => setDispatchForm({ ...dispatchForm, carrier: event.target.value })} maxLength={120} /></label>
                  <label className="grid gap-1 text-sm">Transport details<Input value={dispatchForm.transportDetails} onChange={(event) => setDispatchForm({ ...dispatchForm, transportDetails: event.target.value })} maxLength={1000} /></label>
                  <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={!dispatchForm.packingRecordId || !Number(dispatchForm.quantity) || actionBusy}><Truck className="mr-2 h-4 w-4" />Review dispatch</Button></div>
                </form>}
              </section>

              <section className="space-y-2"><h3 className="font-semibold">Activity timeline</h3>{detail.events.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded.</p>}{detail.events.map((event) => <div key={event.id} className="flex gap-3 border-l-2 border-primary/20 py-1 pl-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0"><p className="text-sm font-medium">{event.event_type.replaceAll("_", " ")}{event.quantity != null ? ` · ${event.quantity} ${detail.order.unit}` : ""}</p><p className="text-xs text-muted-foreground">{event.actor_name} · {new Date(event.created_at).toLocaleString()}{event.reason ? ` · ${event.reason}` : ""}</p></div></div>)}</section>
            </div>}
          </DialogContent>
        </Dialog>

        <Dialog open={dispatchConfirmOpen} onOpenChange={setDispatchConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Confirm dispatch</DialogTitle><DialogDescription>This records a dispatch against accepted, undispatched quantity. The record and reference are permanent audit history.</DialogDescription></DialogHeader>
            <p className="rounded-lg bg-muted p-3 text-sm">{dispatchForm.quantity || 0} {detail?.order.unit || "units"} from {detail?.order.orderNumber} · packed quantity only</p>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDispatchConfirmOpen(false)} disabled={actionBusy}>Cancel</Button><Button onClick={() => void submitDispatch()} disabled={actionBusy}>{actionBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm dispatch</Button></div>
          </DialogContent>
        </Dialog>
      </main>
    </OwnerLayout>
  )
}
