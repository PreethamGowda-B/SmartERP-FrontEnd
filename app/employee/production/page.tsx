"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  getMyProductionOrders,
  ProductionApiUnavailableError,
  ProductionOrder,
  reportProductionBatch,
  startProductionOrder,
  submitBatchForInspection,
} from "@/lib/production-dispatch-api"
import { AlertTriangle, CheckCircle2, Factory, Loader2, RefreshCw } from "lucide-react"

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

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await getMyProductionOrders()
      setOrders(result.orders || [])
    } catch (cause: any) {
      setOrders([])
      setError(cause instanceof ProductionApiUnavailableError
        ? "The production workspace is not active yet. No example orders or actions are shown."
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

  return (
    <EmployeeLayout>
      <main className="mx-auto w-full max-w-5xl space-y-5 p-4 pb-10 md:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Factory className="h-4 w-4 text-primary" /> Production workspace</div><h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">My production orders</h1><p className="mt-1 text-sm text-muted-foreground">Start assigned batches, report actual quantities, and send completed work for inspection.</p></div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </header>

        {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</div>}

        {loading && <Card><CardContent className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading assigned orders…</CardContent></Card>}
        {!loading && !error && orders.length === 0 && <Card><CardContent className="py-14 text-center"><Factory className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" /><p className="font-medium">No production orders assigned</p><p className="mt-1 text-sm text-muted-foreground">When your Owner assigns production work, it will appear here.</p></CardContent></Card>}

        <section className="grid gap-4">
          {orders.map((order) => {
            const activeBatch = Boolean(order.activeBatchId)
            const canStart = !activeBatch && ["planned", "rework_required", "on_hold"].includes(order.status)
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm"><span className="text-muted-foreground">Reported:</span> <span className="font-medium tabular-nums">{order.goodQuantity} good · {order.rejectedQuantity} rejected · {order.reworkQuantity} rework</span></div>
                  <div className="flex flex-wrap gap-2">
                    {canStart && <Button onClick={() => void start(order)} disabled={busyOrderId === order.id}>{busyOrderId === order.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Start production</Button>}
                    {canReport && <Button variant="outline" onClick={() => { setReportOrderId(reportOrderId === order.id ? "" : order.id); setForm(emptyForm) }}>Report quantities</Button>}
                    {canSubmit && <Button variant="secondary" onClick={() => void submitForQuality(order)} disabled={busyBatchId === order.activeBatchId}>{busyBatchId === order.activeBatchId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit for inspection</Button>}
                    {!canStart && !canReport && <span className="self-center text-xs text-muted-foreground">Waiting for the next authorized workflow action.</span>}
                  </div>
                </div>
                {reportOrderId === order.id && <form onSubmit={(event) => void saveReport(event, order)} className="grid gap-3 rounded-xl border bg-background p-4 md:grid-cols-3">
                  <label className="grid gap-1.5 text-sm">Good quantity<Input type="number" min="0" step="0.001" required value={form.good} onChange={(event) => setForm({ ...form, good: event.target.value })} /></label>
                  <label className="grid gap-1.5 text-sm">Rejected quantity<Input type="number" min="0" step="0.001" required value={form.rejected} onChange={(event) => setForm({ ...form, rejected: event.target.value })} /></label>
                  <label className="grid gap-1.5 text-sm">Rework quantity<Input type="number" min="0" step="0.001" required value={form.rework} onChange={(event) => setForm({ ...form, rework: event.target.value })} /></label>
                  <label className="grid gap-1.5 text-sm md:col-span-3">Work notes<textarea maxLength={3000} className="min-h-20 rounded-md border bg-background px-3 py-2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
                  <div className="flex justify-end gap-2 md:col-span-3"><Button type="button" variant="ghost" onClick={() => setReportOrderId("")}>Cancel</Button><Button type="submit" disabled={busyBatchId === order.activeBatchId}>{busyBatchId === order.activeBatchId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save production report</Button></div>
                </form>}
              </CardContent>
            </Card>
          })}
        </section>
      </main>
    </EmployeeLayout>
  )
}
