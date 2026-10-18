"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  getMyProductionOrders,
  ProductionApiUnavailableError,
  ProductionOrder,
  reportProductionBatch,
  startProductionOrder,
  submitBatchForInspection,
  createProductionPackingRecord,
  advanceProductionPacking,
  confirmProductionDispatch,
} from "@/lib/production-dispatch-api"
import { AlertTriangle, CheckCircle2, Factory, Loader2, PackageCheck, RefreshCw, Truck } from "lucide-react"

const statusLabel: Record<string, string> = {
  planned: "Planned", in_production: "In production", quality_check: "Quality check",
  ready_for_dispatch: "Ready for dispatch", partially_dispatched: "Partially dispatched",
  dispatched: "Dispatched", on_hold: "On hold", rework_required: "Rework required",
  rejected: "Rejected", cancelled: "Cancelled",
}

type QuantityForm = { good: string; rejected: string; rework: string; notes: string }
const emptyForm: QuantityForm = { good: "0", rejected: "0", rework: "0", notes: "" }

export default function EmployeeProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [busyOrderId, setBusyOrderId] = useState("")
  const [busyBatchId, setBusyBatchId] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [reportOrderId, setReportOrderId] = useState("")
  const [form, setForm] = useState<QuantityForm>(emptyForm)
  const [packingOrderId, setPackingOrderId] = useState("")
  const [packingForm, setPackingForm] = useState({ inspectionId: "", quantity: "", packageCount: "1", packageType: "" })
  const [busyPackingId, setBusyPackingId] = useState("")
  const [dispatchTarget, setDispatchTarget] = useState<{ order: ProductionOrder; packingId: string; remaining: number } | null>(null)
  const [dispatchForm, setDispatchForm] = useState({ quantity: "", deliveryReference: "", carrier: "" })

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await getMyProductionOrders()
      setOrders(result.orders || [])
    } catch (cause: any) {
      setOrders([])
      setError(cause instanceof ProductionApiUnavailableError
        ? cause.message
        : cause?.message || "Unable to load your assigned production work.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const start = async (order: ProductionOrder) => {
    setBusyOrderId(order.id)
    setError("")
    setNotice("")
    try {
      const result = await startProductionOrder(order.id)
      setNotice(`Production batch started at ${new Date(result.startedAt).toLocaleString()}.`)
      await load()
    } catch (cause: any) {
      setError(cause?.message || "Unable to start this production order.")
    } finally {
      setBusyOrderId("")
    }
  }

  const saveReport = async (event: FormEvent<HTMLFormElement>, order: ProductionOrder) => {
    event.preventDefault()
    if (!order.activeBatchId) return
    setBusyBatchId(order.activeBatchId)
    setError("")
    setNotice("")
    try {
      const result = await reportProductionBatch(order.activeBatchId, {
        goodQuantity: Number(form.good),
        rejectedQuantity: Number(form.rejected),
        reworkQuantity: Number(form.rework),
        notes: form.notes.trim() || undefined,
      })
      setNotice(`Production report saved at ${new Date(result.report.reportedAt).toLocaleString()}.`)
      setReportOrderId("")
      setForm(emptyForm)
      await load()
    } catch (cause: any) {
      setError(cause?.message || "The production report could not be saved.")
    } finally {
      setBusyBatchId("")
    }
  }

  const submitForQuality = async (order: ProductionOrder) => {
    if (!order.activeBatchId) return
    setBusyBatchId(order.activeBatchId)
    setError("")
    setNotice("")
    try {
      const result = await submitBatchForInspection(order.activeBatchId)
      setNotice(`Batch submitted for quality inspection at ${new Date(result.submittedAt).toLocaleString()}.`)
      await load()
    } catch (cause: any) {
      setError(cause?.message || "Unable to submit this batch for inspection.")
    } finally {
      setBusyBatchId("")
    }
  }

  const savePacking = async (event: FormEvent<HTMLFormElement>, order: ProductionOrder) => {
    event.preventDefault()
    setBusyPackingId(order.id); setError(""); setNotice("")
    try {
      const result = await createProductionPackingRecord(order.id, { inspectionId: packingForm.inspectionId, quantity: Number(packingForm.quantity), packageCount: Number(packingForm.packageCount), packageType: packingForm.packageType.trim() || undefined })
      setNotice(`Packing record created. ${result.remainingPackableQuantity} ${order.unit} remains available from that inspection.`)
      setPackingForm({ ...packingForm, quantity: "", packageType: "" })
      setPackingOrderId("")
      await load()
    } catch (cause: any) { setError(cause?.message || "Packing record could not be saved.") }
    finally { setBusyPackingId("") }
  }

  const progressPacking = async (packingId: string, status: "packed" | "ready_for_dispatch") => {
    setBusyPackingId(packingId); setError(""); setNotice("")
    try {
      await advanceProductionPacking(packingId, status)
      setNotice(status === "packed" ? "Packing marked complete." : "This packed quantity is ready for dispatch.")
      await load()
    } catch (cause: any) { setError(cause?.message || "Packing progress could not be updated.") }
    finally { setBusyPackingId("") }
  }

  const dispatch = async () => {
    if (!dispatchTarget) return
    setBusyPackingId(dispatchTarget.packingId); setError(""); setNotice("")
    try {
      const result = await confirmProductionDispatch(dispatchTarget.order.id, { packingRecordId: dispatchTarget.packingId, quantity: Number(dispatchForm.quantity), confirmed: true, deliveryReference: dispatchForm.deliveryReference.trim() || undefined, carrier: dispatchForm.carrier.trim() || undefined })
      setNotice(`Dispatch ${result.dispatch.reference} recorded for ${result.dispatch.quantity} ${dispatchTarget.order.unit} at ${new Date(result.dispatch.dispatchedAt).toLocaleString()}.`)
      setDispatchTarget(null); setDispatchForm({ quantity: "", deliveryReference: "", carrier: "" })
      await load()
    } catch (cause: any) { setError(cause?.message || "Dispatch could not be confirmed.") }
    finally { setBusyPackingId("") }
  }

  return (
    <EmployeeLayout>
      <main className="mx-auto w-full max-w-5xl space-y-5 p-4 pb-10 md:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Factory className="h-4 w-4 text-primary" /> Production workspace</div><h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">My production orders</h1><p className="mt-1 text-sm text-muted-foreground">Work on assigned production and dispatch tasks. Quality-approved quantity is required before packing.</p></div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </header>

        {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</div>}

        {loading && <Card><CardContent className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading assigned orders…</CardContent></Card>}
        {!loading && !error && orders.length === 0 && <Card><CardContent className="py-14 text-center"><Factory className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" /><p className="font-medium">No production orders assigned</p><p className="mt-1 text-sm text-muted-foreground">When your Owner assigns production work, it will appear here.</p></CardContent></Card>}

        <section className="grid gap-4">
          {orders.map((order) => {
            const isOperator = order.isAssignedOperator !== false
            const isDispatcher = order.isAssignedDispatcher === true
            const activeBatch = Boolean(order.activeBatchId)
            const hasRemainingPlannedQuantity = order.goodQuantity < order.plannedQuantity
            const canStart = !activeBatch && (["planned", "rework_required", "on_hold"].includes(order.status) || (["ready_for_dispatch", "partially_dispatched"].includes(order.status) && hasRemainingPlannedQuantity))
            const canReport = activeBatch && ["in_production", "rework_required"].includes(order.status)
            const canSubmit = activeBatch && canReport && order.activeBatchHasReport === true
            return <Card key={order.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-base">{order.componentName}</CardTitle><Badge variant="outline">{statusLabel[order.status] || order.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{order.orderNumber} · Part {order.partNumber}</p></div>
                <Badge variant={order.priority === "urgent" || order.priority === "high" ? "destructive" : "secondary"}>{order.priority}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm md:grid-cols-4">
                  <div><p className="text-xs text-muted-foreground">Customer</p><p className="mt-1 font-medium">{order.customerName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Plan</p><p className="mt-1 font-medium tabular-nums">{order.plannedQuantity} {order.unit}</p></div>
                  <div><p className="text-xs text-muted-foreground">Machine</p><p className="mt-1 font-medium">{order.machineName || "Not assigned"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Due</p><p className="mt-1 font-medium">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : "—"}</p></div>
                </div>
                {order.latestInspectionResult && <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/20"><p className="font-medium">Latest quality result: {order.latestInspectionResult.replaceAll("_", " ")}</p>{order.latestInspectionReason && <p className="mt-1 text-muted-foreground">Inspector feedback: {order.latestInspectionReason}</p>}{order.latestInspectionAt && <p className="mt-1 text-xs text-muted-foreground">{new Date(order.latestInspectionAt).toLocaleString()}</p>}</div>}
                {isOperator && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm"><span className="text-muted-foreground">Reported:</span> <span className="font-medium tabular-nums">{order.goodQuantity} good · {order.rejectedQuantity} rejected · {order.reworkQuantity} rework</span></div>
                  <div className="flex flex-wrap gap-2">
                    {canStart && <Button onClick={() => void start(order)} disabled={busyOrderId === order.id}>{busyOrderId === order.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Start production</Button>}
                    {canReport && <Button variant="outline" onClick={() => { setReportOrderId(reportOrderId === order.id ? "" : order.id); setForm(emptyForm) }}>Report quantities</Button>}
                    {canSubmit && <Button variant="secondary" onClick={() => void submitForQuality(order)} disabled={busyBatchId === order.activeBatchId}>{busyBatchId === order.activeBatchId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit for inspection</Button>}
                    {!canStart && !canReport && <span className="self-center text-xs text-muted-foreground">Waiting for the next authorized workflow action.</span>}
                  </div>
                </div>}
                {isOperator && reportOrderId === order.id && <form onSubmit={(event) => void saveReport(event, order)} className="grid gap-3 rounded-xl border bg-background p-4 md:grid-cols-3">
                  <label className="grid gap-1.5 text-sm">Good quantity<Input type="number" min="0" step="0.001" required value={form.good} onChange={(event) => setForm({ ...form, good: event.target.value })} /></label>
                  <label className="grid gap-1.5 text-sm">Rejected quantity<Input type="number" min="0" step="0.001" required value={form.rejected} onChange={(event) => setForm({ ...form, rejected: event.target.value })} /></label>
                  <label className="grid gap-1.5 text-sm">Rework quantity<Input type="number" min="0" step="0.001" required value={form.rework} onChange={(event) => setForm({ ...form, rework: event.target.value })} /></label>
                  <label className="grid gap-1.5 text-sm md:col-span-3">Work notes<textarea maxLength={3000} className="min-h-20 rounded-md border bg-background px-3 py-2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
                  <div className="flex justify-end gap-2 md:col-span-3"><Button type="button" variant="ghost" onClick={() => setReportOrderId("")}>Cancel</Button><Button type="submit" disabled={busyBatchId === order.activeBatchId}>{busyBatchId === order.activeBatchId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save production report</Button></div>
                </form>}
                {isDispatcher && <section className="space-y-3 rounded-xl border border-primary/20 bg-primary/[0.02] p-4">
                  <div><h3 className="flex items-center gap-2 font-semibold"><PackageCheck className="h-4 w-4 text-primary" />Packing &amp; dispatch</h3><p className="mt-1 text-xs text-muted-foreground">Record actual packing against accepted inspection quantity, then advance it only when physically packed and ready to leave.</p></div>
                  {packingOrderId === order.id && <form onSubmit={(event) => void savePacking(event, order)} className="grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs sm:col-span-2">Accepted inspection lot<select required className="h-10 rounded-md border bg-background px-3 text-sm" value={packingForm.inspectionId} onChange={(event) => setPackingForm({ ...packingForm, inspectionId: event.target.value })}><option value="">Choose an accepted inspection</option>{(order.inspections || []).filter((inspection) => Number(inspection.accepted_quantity) > 0).map((inspection) => <option key={inspection.id} value={inspection.id}>{inspection.inspection_reference} · {inspection.accepted_quantity} accepted</option>)}</select></label>
                    <label className="grid gap-1 text-xs">Quantity<Input required type="number" min="0.001" step="0.001" value={packingForm.quantity} onChange={(event) => setPackingForm({ ...packingForm, quantity: event.target.value })} /></label>
                    <label className="grid gap-1 text-xs">Package count<Input required type="number" min="1" step="1" value={packingForm.packageCount} onChange={(event) => setPackingForm({ ...packingForm, packageCount: event.target.value })} /></label>
                    <label className="grid gap-1 text-xs sm:col-span-2">Package type (optional)<Input maxLength={100} placeholder="Box, crate, pallet…" value={packingForm.packageType} onChange={(event) => setPackingForm({ ...packingForm, packageType: event.target.value })} /></label>
                    <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={() => setPackingOrderId("")}>Cancel</Button><Button type="submit" disabled={busyPackingId === order.id || !packingForm.inspectionId || !Number(packingForm.quantity)}>{busyPackingId === order.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save packing record</Button></div>
                  </form>}
                  {(order.packingRecords || []).length === 0 && <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No packing recorded yet.</p>}
                  {(order.packingRecords || []).map((record) => <div key={record.id} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{record.quantity} {order.unit} · {record.package_count} package(s)</p><p className="text-xs text-muted-foreground">{record.status.replaceAll("_", " ")} · {record.remaining_quantity} not yet dispatched{record.package_type ? ` · ${record.package_type}` : ""}</p></div><div className="flex flex-wrap gap-2">{record.status === "packing" && <Button size="sm" variant="outline" onClick={() => void progressPacking(record.id, "packed")} disabled={Boolean(busyPackingId)}>Mark packed</Button>}{record.status === "packed" && <Button size="sm" onClick={() => void progressPacking(record.id, "ready_for_dispatch")} disabled={Boolean(busyPackingId)}>Ready for dispatch</Button>}{record.status === "ready_for_dispatch" && Number(record.remaining_quantity) > 0 && <Button size="sm" onClick={() => { setDispatchTarget({ order, packingId: record.id, remaining: Number(record.remaining_quantity) }); setDispatchForm({ quantity: String(record.remaining_quantity), deliveryReference: "", carrier: "" }) }}><Truck className="mr-1.5 h-4 w-4" />Dispatch</Button>}</div></div>)}
                  <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => { setPackingOrderId(packingOrderId === order.id ? "" : order.id); setPackingForm({ inspectionId: (order.inspections || []).find((inspection) => Number(inspection.accepted_quantity) > 0)?.id || "", quantity: "", packageCount: "1", packageType: "" }) }} disabled={!(order.inspections || []).some((inspection) => Number(inspection.accepted_quantity) > 0)}>Record packing</Button></div>
                </section>}
              </CardContent>
            </Card>
          })}
        </section>
      </main>
      <Dialog open={Boolean(dispatchTarget)} onOpenChange={(open) => { if (!open && !busyPackingId) setDispatchTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirm dispatch</DialogTitle><DialogDescription>Confirm the physical shipment. Only remaining quantity from a quality-approved, ready packing record can be dispatched.</DialogDescription></DialogHeader>
          {dispatchTarget && <div className="space-y-3"><p className="rounded-lg bg-muted p-3 text-sm">{dispatchTarget.order.orderNumber} · {dispatchTarget.order.componentName} · up to {dispatchTarget.remaining} {dispatchTarget.order.unit}</p><label className="grid gap-1 text-sm">Quantity<Input required type="number" min="0.001" max={dispatchTarget.remaining} step="0.001" value={dispatchForm.quantity} onChange={(event) => setDispatchForm({ ...dispatchForm, quantity: event.target.value })} /></label><label className="grid gap-1 text-sm">Delivery reference<Input maxLength={120} value={dispatchForm.deliveryReference} onChange={(event) => setDispatchForm({ ...dispatchForm, deliveryReference: event.target.value })} /></label><label className="grid gap-1 text-sm">Carrier<Input maxLength={120} value={dispatchForm.carrier} onChange={(event) => setDispatchForm({ ...dispatchForm, carrier: event.target.value })} /></label></div>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDispatchTarget(null)} disabled={Boolean(busyPackingId)}>Cancel</Button><Button onClick={() => void dispatch()} disabled={!dispatchTarget || !Number(dispatchForm.quantity) || Number(dispatchForm.quantity) > (dispatchTarget?.remaining || 0) || Boolean(busyPackingId)}>{busyPackingId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm dispatch</Button></div>
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  )
}
