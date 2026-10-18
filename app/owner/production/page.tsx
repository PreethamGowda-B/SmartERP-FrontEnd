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
  getProductionDashboard,
  getProductionOrders,
  getProductionReferences,
  ProductionApiUnavailableError,
  ProductionDashboard,
  ProductionOrder,
  ProductionOrderDraft,
  ProductionReferences,
  ProductionStatus,
  PlannedMaterialLine,
} from "@/lib/production-dispatch-api"
import { AlertTriangle, Factory, Loader2, Plus, RefreshCw, Search, Truck, X } from "lucide-react"

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
  priority: "medium", machineId: "", assignedEmployeeId: "", instructions: "", jobId: "",
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
        ? "Production data is unavailable until the approved production API and database schema are activated. No sample data is shown."
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

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError("")
    setSaving(true)
    try {
      await createProductionOrder({
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
      setShowCreate(false)
      setDraft(emptyDraft)
      setMaterialLines([])
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
                  <th className="px-3 py-3">Order / customer</th><th className="px-3 py-3">Component</th><th className="px-3 py-3">Part / drawing</th><th className="px-3 py-3">Quantity</th><th className="px-3 py-3">Machine / operator</th><th className="px-3 py-3">Due date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Dispatch remaining</th>
                </tr></thead>
                <tbody className="divide-y">
                  {loading && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading production data…</td></tr>}
                  {!loading && !error && orders.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center"><Factory className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" /><p className="font-medium">No production orders yet</p><p className="mt-1 text-xs text-muted-foreground">Create a production order to start tracing manufacturing and dispatch.</p></td></tr>}
                  {!loading && orders.map((order) => <tr key={order.id} className="hover:bg-muted/30">
                    <td className="px-3 py-3"><div className="font-medium">{order.orderNumber}</div><div className="text-xs text-muted-foreground">{order.customerName}{order.customerOrderReference ? ` · ${order.customerOrderReference}` : ""}</div></td>
                    <td className="px-3 py-3 font-medium">{order.componentName}</td>
                    <td className="px-3 py-3"><div>{order.partNumber}</div><div className="text-xs text-muted-foreground">{order.drawingNumber || "No drawing"}{order.drawingRevision ? ` · Rev ${order.drawingRevision}` : ""}</div></td>
                    <td className="px-3 py-3 tabular-nums"><div>{order.goodQuantity} good / {order.plannedQuantity} {order.unit}</div><div className="text-xs text-muted-foreground">{order.rejectedQuantity} rejected · {order.reworkQuantity} rework</div></td>
                    <td className="px-3 py-3"><div>{order.machineName || "Unassigned machine"}</div><div className="text-xs text-muted-foreground">{order.assignedEmployeeName || "Unassigned operator"}</div></td>
                    <td className="px-3 py-3">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-3"><Badge variant="outline">{STATUS_LABELS[order.status] || order.status}</Badge></td>
                    <td className="px-3 py-3"><div className="flex items-center gap-2"><Truck className="h-4 w-4 text-muted-foreground" /><span className="tabular-nums">{order.outstandingQuantity} {order.unit}</span></div><div className="text-xs text-muted-foreground">{order.dispatchedQuantity} shipped</div></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            {total > pageSize && <div className="mt-4 flex items-center justify-end gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>Previous</Button><span className="text-xs text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span><Button variant="outline" size="sm" disabled={page >= Math.ceil(total / pageSize) || loading} onClick={() => void load(page + 1)}>Next</Button></div>}
          </CardContent>
        </Card>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>Create production order</DialogTitle><DialogDescription>Customer, machine, employee, inventory, and job choices must come from this company’s verified records.</DialogDescription></DialogHeader>
            {referencesLoading && <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading company references…</div>}
            {!referencesLoading && !references && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{formError || "Verified production reference data is unavailable. The order form is disabled."}</div>}
            {references && <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitOrder}>
              <label className="grid gap-1.5 text-sm sm:col-span-2">Customer *<select required className="h-10 rounded-md border bg-background px-3" value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}><option value="">Choose a customer</option>{references.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm">Component name *<Input required value={draft.componentName} onChange={(e) => setDraft({ ...draft, componentName: e.target.value })} maxLength={200} /></label>
              <label className="grid gap-1.5 text-sm">Part number *<Input required value={draft.partNumber} onChange={(e) => setDraft({ ...draft, partNumber: e.target.value })} maxLength={100} /></label>
              <label className="grid gap-1.5 text-sm">Drawing number<Input value={draft.drawingNumber} onChange={(e) => setDraft({ ...draft, drawingNumber: e.target.value })} maxLength={100} /></label>
              <label className="grid gap-1.5 text-sm">Drawing revision<Input value={draft.drawingRevision} onChange={(e) => setDraft({ ...draft, drawingRevision: e.target.value })} maxLength={40} /></label>
              <label className="grid gap-1.5 text-sm">Planned quantity *<Input required type="number" min="0.001" step="0.001" value={draft.plannedQuantity} onChange={(e) => setDraft({ ...draft, plannedQuantity: Number(e.target.value) })} /></label>
              <label className="grid gap-1.5 text-sm">Unit *<Input required value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} maxLength={24} /></label>
              <label className="grid gap-1.5 text-sm">Required completion date *<Input required type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /></label>
              <label className="grid gap-1.5 text-sm">Priority<select className="h-10 rounded-md border bg-background px-3" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as ProductionOrderDraft["priority"] })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              <label className="grid gap-1.5 text-sm">Machine / work centre<select className="h-10 rounded-md border bg-background px-3" value={draft.machineId} onChange={(e) => setDraft({ ...draft, machineId: e.target.value })}><option value="">Unassigned</option>{references.machines.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm">Assigned operator<select className="h-10 rounded-md border bg-background px-3" value={draft.assignedEmployeeId} onChange={(e) => setDraft({ ...draft, assignedEmployeeId: e.target.value })}><option value="">Unassigned</option>{references.employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
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
      </main>
    </OwnerLayout>
  )
}
