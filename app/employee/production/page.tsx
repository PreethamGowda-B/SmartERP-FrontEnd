"use client"

import React, { FormEvent, useCallback, useEffect, useState, useMemo } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Factory,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Loader2,
  Calendar,
  Cpu,
  Building2,
  Box,
  Layers,
  ChevronRight,
  ClipboardList,
  Sparkles,
  ShieldCheck,
  Send,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  planned: {
    label: "Planned",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    icon: Clock,
  },
  in_production: {
    label: "In Machining / Repair",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Wrench,
  },
  quality_check: {
    label: "Quality Inspection",
    badgeClass: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    icon: ShieldCheck,
  },
  ready_for_dispatch: {
    label: "Ready for Dispatch",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold",
    icon: PackageCheck,
  },
  partially_dispatched: {
    label: "Partially Dispatched",
    badgeClass: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    icon: Truck,
  },
  dispatched: {
    label: "Dispatched",
    badgeClass: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-800 font-bold",
    icon: CheckCircle2,
  },
  rework_required: {
    label: "Rework Required",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: AlertTriangle,
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: AlertTriangle,
  },
}

type QuantityForm = { good: string; rejected: string; rework: string; notes: string }
const emptyForm: QuantityForm = { good: "0", rejected: "0", rework: "0", notes: "" }

export default function EmployeeProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "in_production" | "ready_for_dispatch" | "completed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [lastSync, setLastSync] = useState<Date | null>(null)

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
      setLastSync(new Date())
    } catch (cause: any) {
      setOrders([])
      setError(
        cause instanceof ProductionApiUnavailableError
          ? cause.message
          : cause?.message || "Unable to load your assigned production work."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Top KPI metric calculations
  const totalCount = orders.length
  const inProductionCount = orders.filter((o) => o.status === "in_production" || o.status === "planned" || o.status === "rework_required").length
  const readyDispatchCount = orders.filter((o) => o.status === "ready_for_dispatch" || o.status === "quality_check").length
  const completedCount = orders.filter((o) => o.status === "dispatched" || o.status === "partially_dispatched").length

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === "in_production" && !(order.status === "in_production" || order.status === "planned" || order.status === "rework_required")) return false
      if (activeTab === "ready_for_dispatch" && !(order.status === "ready_for_dispatch" || order.status === "quality_check")) return false
      if (activeTab === "completed" && !(order.status === "dispatched" || order.status === "partially_dispatched")) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = (order.componentName || "").toLowerCase().includes(q)
        const matchesNumber = (order.orderNumber || "").toLowerCase().includes(q)
        const matchesPart = (order.partNumber || "").toLowerCase().includes(q)
        const matchesCustomer = (order.customerName || "").toLowerCase().includes(q)
        return matchesName || matchesNumber || matchesPart || matchesCustomer
      }

      return true
    })
  }, [orders, activeTab, searchQuery])

  // Start production batch
  const start = async (order: ProductionOrder) => {
    setBusyOrderId(order.id)
    setError("")
    setNotice("")
    try {
      const result = await startProductionOrder(order.id)
      setNotice(`Production batch started at ${new Date(result.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`)
      await load()
    } catch (cause: any) {
      setError(cause?.message || "Unable to start this production order.")
    } finally {
      setBusyOrderId("")
    }
  }

  // Save report batch quantities
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
      setNotice(`Production report saved at ${new Date(result.report.reportedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`)
      setReportOrderId("")
      setForm(emptyForm)
      await load()
    } catch (cause: any) {
      setError(cause?.message || "The production report could not be saved.")
    } finally {
      setBusyBatchId("")
    }
  }

  // Submit batch for quality inspection
  const submitForQuality = async (order: ProductionOrder) => {
    if (!order.activeBatchId) return
    setBusyBatchId(order.activeBatchId)
    setError("")
    setNotice("")
    try {
      const result = await submitBatchForInspection(order.activeBatchId)
      setNotice(`Batch submitted for quality inspection at ${new Date(result.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`)
      await load()
    } catch (cause: any) {
      setError(cause?.message || "Unable to submit this batch for inspection.")
    } finally {
      setBusyBatchId("")
    }
  }

  // Create packing record
  const savePacking = async (event: FormEvent<HTMLFormElement>, order: ProductionOrder) => {
    event.preventDefault()
    setBusyPackingId(order.id)
    setError("")
    setNotice("")
    try {
      const result = await createProductionPackingRecord(order.id, {
        inspectionId: packingForm.inspectionId,
        quantity: Number(packingForm.quantity),
        packageCount: Number(packingForm.packageCount),
        packageType: packingForm.packageType.trim() || undefined,
      })
      setNotice(`Packing record created. ${result.remainingPackableQuantity} ${order.unit} remaining from inspection.`)
      setPackingForm({ ...packingForm, quantity: "", packageType: "" })
      setPackingOrderId("")
      await load()
    } catch (cause: any) {
      setError(cause?.message || "Packing record could not be saved.")
    } finally {
      setBusyPackingId("")
    }
  }

  // Advance packing status
  const progressPacking = async (packingId: string, status: "packed" | "ready_for_dispatch") => {
    setBusyPackingId(packingId)
    setError("")
    setNotice("")
    try {
      await advanceProductionPacking(packingId, status)
      setNotice(status === "packed" ? "Packing marked complete." : "Packed lot is now ready for dispatch.")
      await load()
    } catch (cause: any) {
      setError(cause?.message || "Packing progress could not be updated.")
    } finally {
      setBusyPackingId("")
    }
  }

  // Final dispatch confirmation
  const dispatch = async () => {
    if (!dispatchTarget) return
    setBusyPackingId(dispatchTarget.packingId)
    setError("")
    setNotice("")
    try {
      const result = await confirmProductionDispatch(dispatchTarget.order.id, {
        packingRecordId: dispatchTarget.packingId,
        quantity: Number(dispatchForm.quantity),
        confirmed: true,
        deliveryReference: dispatchForm.deliveryReference.trim() || undefined,
        carrier: dispatchForm.carrier.trim() || undefined,
      })
      setNotice(`Dispatch ${result.dispatch.reference} recorded for ${result.dispatch.quantity} ${dispatchTarget.order.unit}.`)
      setDispatchTarget(null)
      setDispatchForm({ quantity: "", deliveryReference: "", carrier: "" })
      await load()
    } catch (cause: any) {
      setError(cause?.message || "Dispatch could not be confirmed.")
    } finally {
      setBusyPackingId("")
    }
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header matching other Employee Portal pages */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Production &amp; Dispatch Workspace
              </h1>
              <Badge variant="outline" className="text-[10px] font-mono tracking-wider font-bold py-0.5 px-2 bg-amber-500/10 text-amber-700 border-amber-500/30">
                Workshop Operations
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Execute assigned machining jobs, log unit outputs, submit for QC verification, and prepare dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[10px] text-muted-foreground hidden lg:flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3 text-amber-500" />
              LAST SYNC: {lastSync ? lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Just now"}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
              className="h-9 text-xs font-bold rounded-xl gap-1.5 border-border/70 hover:bg-amber-500/10 hover:text-amber-700"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Sync Orders
            </Button>
          </div>
        </div>

        {/* 4 Metric Cards matching Employee Portal UI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card
            onClick={() => setActiveTab("all")}
            className={cn(
              "border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer",
              activeTab === "all" && "border-amber-500 ring-2 ring-amber-500/20"
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Assigned Orders
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                    {totalCount}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 inline-block">
                    Total workload
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Factory className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setActiveTab("in_production")}
            className={cn(
              "border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer",
              activeTab === "in_production" && "border-blue-500 ring-2 ring-blue-500/20"
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    In Machining
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                    {inProductionCount}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 inline-block">
                    Active on bench
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Wrench className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setActiveTab("ready_for_dispatch")}
            className={cn(
              "border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer",
              activeTab === "ready_for_dispatch" && "border-emerald-500 ring-2 ring-emerald-500/20"
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Ready to Dispatch
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
                    {readyDispatchCount}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 inline-block">
                    QC approved lots
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <PackageCheck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setActiveTab("completed")}
            className={cn(
              "border-border/80 shadow-xs hover:shadow-md transition-all cursor-pointer",
              activeTab === "completed" && "border-purple-500 ring-2 ring-purple-500/20"
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                    Dispatched
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                    {completedCount}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 inline-block">
                    Shipped to client
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Switcher Ribbon & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1.5 bg-card rounded-2xl border border-border/70 shadow-xs overflow-x-auto no-scrollbar">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "all" && "bg-amber-600 text-white hover:bg-amber-700 shadow-xs")}
              onClick={() => setActiveTab("all")}
            >
              <Layers className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              All Orders ({totalCount})
            </Button>

            <Button
              variant={activeTab === "in_production" ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "in_production" && "bg-blue-600 text-white hover:bg-blue-700 shadow-xs")}
              onClick={() => setActiveTab("in_production")}
            >
              <Wrench className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              In Machining ({inProductionCount})
            </Button>

            <Button
              variant={activeTab === "ready_for_dispatch" ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "ready_for_dispatch" && "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs")}
              onClick={() => setActiveTab("ready_for_dispatch")}
            >
              <PackageCheck className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              Ready for Dispatch ({readyDispatchCount})
            </Button>

            <Button
              variant={activeTab === "completed" ? "default" : "ghost"}
              size="sm"
              className={cn("h-8 text-xs font-bold rounded-xl px-3.5", activeTab === "completed" && "bg-purple-600 text-white hover:bg-purple-700 shadow-xs")}
              onClick={() => setActiveTab("completed")}
            >
              <Truck className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              Dispatched ({completedCount})
            </Button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search component, order, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-card border-border/70"
            />
          </div>
        </div>

        {/* Notices & Errors */}
        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100 shadow-2xs">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Orders Listing */}
        {loading ? (
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
              <p className="text-xs font-semibold">Synchronizing assigned production orders...</p>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="rounded-2xl border-border/80 border-dashed shadow-xs">
            <CardContent className="py-16 text-center space-y-3">
              <div className="p-3.5 rounded-full bg-amber-500/10 text-amber-600 w-fit mx-auto">
                <Factory className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-base text-foreground">No production orders found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? "No orders match your search criteria. Try a different search term or clear the filter."
                  : "You currently have no assigned machining or repair orders. New jobs from your supervisor will appear here automatically."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusMeta = STATUS_CONFIG[order.status] || {
                label: order.status.replace(/_/g, " "),
                badgeClass: "bg-slate-100 text-slate-700",
                icon: Clock,
              }
              const StatusIcon = statusMeta.icon

              const isOperator = order.isAssignedOperator !== false
              const isDispatcher = order.isAssignedDispatcher === true
              const activeBatch = Boolean(order.activeBatchId)
              const hasRemainingPlannedQuantity = order.goodQuantity < order.plannedQuantity
              const canStart = !activeBatch && (["planned", "rework_required", "on_hold"].includes(order.status) || (["ready_for_dispatch", "partially_dispatched"].includes(order.status) && hasRemainingPlannedQuantity))
              const canReport = activeBatch && ["in_production", "rework_required"].includes(order.status)
              const canSubmit = activeBatch && canReport && order.activeBatchHasReport === true

              const priorityPillClass =
                order.priority === "urgent" || order.priority === "high"
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-900"
                  : order.priority === "medium"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"

              return (
                <Card
                  key={order.id}
                  className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all overflow-hidden bg-card"
                >
                  <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-foreground">
                            {order.componentName}
                          </h2>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badgeClass}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusMeta.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${priorityPillClass}`}>
                            {order.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <span className="font-bold text-amber-700 dark:text-amber-400">{order.orderNumber}</span>
                          <span>•</span>
                          <span>Part: {order.partNumber}</span>
                          {order.drawingNumber && <span>• DWG: {order.drawingNumber}</span>}
                        </div>
                      </div>

                      {/* Quick progress indicator */}
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold text-muted-foreground">Order Target</p>
                        <p className="text-sm font-bold text-foreground">
                          {order.goodQuantity} / {order.plannedQuantity} {order.unit}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-4">
                    {/* 4 Cell Metadata Grid with Icons */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/60 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <Building2 className="h-3.5 w-3.5 text-blue-500" />
                          <span>Customer Facility</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm truncate">
                          {order.customerName || "In-House Workshop"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <Cpu className="h-3.5 w-3.5 text-amber-500" />
                          <span>Machine / Station</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm truncate">
                          {order.machineName || "CNC Service Bench"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <Box className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Plan &amp; Unit</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm">
                          {order.plannedQuantity} {order.unit}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5 text-purple-500" />
                          <span>Required Due Date</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm">
                          {order.dueDate ? new Date(order.dueDate).toLocaleDateString("en-IN") : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Latest Quality Result Highlight */}
                    {order.latestInspectionResult && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900 text-xs">
                        <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-violet-900 dark:text-violet-200">
                              Quality Inspection: {order.latestInspectionResult.replace(/_/g, " ").toUpperCase()}
                            </span>
                            {order.latestInspectionAt && (
                              <span className="text-[10px] text-violet-600/80 font-mono">
                                {new Date(order.latestInspectionAt).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          {order.latestInspectionReason && (
                            <p className="text-violet-700 dark:text-violet-300">
                              Feedback: {order.latestInspectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Operator Workflow Controls */}
                    {isOperator && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/50">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-bold text-foreground">Machining Status:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{order.goodQuantity} good</span>
                          <span>•</span>
                          <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">{order.rejectedQuantity} rejected</span>
                          <span>•</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{order.reworkQuantity} rework</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {canStart && (
                            <Button
                              size="sm"
                              onClick={() => void start(order)}
                              disabled={busyOrderId === order.id}
                              className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 shadow-2xs"
                            >
                              {busyOrderId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
                              Start Production Batch
                            </Button>
                          )}

                          {canReport && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReportOrderId(reportOrderId === order.id ? "" : order.id)
                                setForm(emptyForm)
                              }}
                              className="h-8 text-xs font-bold rounded-xl gap-1.5 border-border/70 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                            >
                              <ClipboardList className="h-3.5 w-3.5" />
                              {reportOrderId === order.id ? "Close Report" : "Log Batch Output"}
                            </Button>
                          )}

                          {canSubmit && (
                            <Button
                              size="sm"
                              onClick={() => void submitForQuality(order)}
                              disabled={busyBatchId === order.activeBatchId}
                              className="h-8 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-1.5 shadow-2xs"
                            >
                              {busyBatchId === order.activeBatchId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                              Submit for Inspection
                            </Button>
                          )}

                          {!canStart && !canReport && (
                            <span className="text-xs text-muted-foreground italic">
                              {order.status === "dispatched"
                                ? "Order dispatched. No employee action required."
                                : "Waiting for next inspection decision."}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inline Quantity Reporting Form */}
                    {isOperator && reportOrderId === order.id && (
                      <form
                        onSubmit={(event) => void saveReport(event, order)}
                        className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-3"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-blue-200/60 dark:border-blue-900/60">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <ClipboardList className="h-4 w-4" /> Log Completed Quantities for Batch
                          </span>
                          <span className="text-[10px] text-muted-foreground">Order: {order.orderNumber}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              Good / Passed Units *
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              required
                              value={form.good}
                              onChange={(event) => setForm({ ...form, good: event.target.value })}
                              className="h-8 text-xs bg-card"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                              Rejected Units *
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              required
                              value={form.rejected}
                              onChange={(event) => setForm({ ...form, rejected: event.target.value })}
                              className="h-8 text-xs bg-card"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                              Rework Required *
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              required
                              value={form.rework}
                              onChange={(event) => setForm({ ...form, rework: event.target.value })}
                              className="h-8 text-xs bg-card"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Work Notes / Bench Observations</Label>
                          <Textarea
                            placeholder="e.g. Completed initial roughing & finish turning. Spindle test passed within 0.005mm tolerance."
                            maxLength={3000}
                            value={form.notes}
                            onChange={(event) => setForm({ ...form, notes: event.target.value })}
                            rows={2}
                            className="text-xs bg-card"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setReportOrderId("")}
                            className="h-8 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={busyBatchId === order.activeBatchId}
                            className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5"
                          >
                            {busyBatchId === order.activeBatchId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Save Production Report
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Dispatcher Packing & Shipment Management */}
                    {isDispatcher && (
                      <section className="space-y-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10 p-3.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                              <PackageCheck className="h-4 w-4 text-emerald-600" /> Packing &amp; Dispatch Oversight
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Record packing lots against QC-approved quantities, then dispatch ready packages.
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setPackingOrderId(packingOrderId === order.id ? "" : order.id)
                              setPackingForm({
                                inspectionId: (order.inspections || []).find((insp) => Number(insp.accepted_quantity) > 0)?.id || "",
                                quantity: "",
                                packageCount: "1",
                                packageType: "",
                              })
                            }}
                            disabled={!(order.inspections || []).some((insp) => Number(insp.accepted_quantity) > 0)}
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {packingOrderId === order.id ? "Close Packing Form" : "Create Packing Lot"}
                          </Button>
                        </div>

                        {/* Inline Packing Creation Form */}
                        {packingOrderId === order.id && (
                          <form
                            onSubmit={(event) => void savePacking(event, order)}
                            className="p-3.5 rounded-xl border bg-card space-y-3"
                          >
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold">Accepted Inspection Batch *</Label>
                              <select
                                required
                                className="h-9 w-full rounded-xl border bg-background px-3 text-xs"
                                value={packingForm.inspectionId}
                                onChange={(event) => setPackingForm({ ...packingForm, inspectionId: event.target.value })}
                              >
                                <option value="">Choose an accepted inspection lot</option>
                                {(order.inspections || [])
                                  .filter((insp) => Number(insp.accepted_quantity) > 0)
                                  .map((insp) => (
                                    <option key={insp.id} value={insp.id}>
                                      {insp.inspection_reference} — {insp.accepted_quantity} {order.unit} accepted
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold">Quantity to Pack *</Label>
                                <Input
                                  required
                                  type="number"
                                  min="0.001"
                                  step="0.001"
                                  value={packingForm.quantity}
                                  onChange={(event) => setPackingForm({ ...packingForm, quantity: event.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs font-semibold">Package Count *</Label>
                                <Input
                                  required
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={packingForm.packageCount}
                                  onChange={(event) => setPackingForm({ ...packingForm, packageCount: event.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Packaging Type (Optional)</Label>
                                <Input
                                  maxLength={100}
                                  placeholder="Box, crate, wooden pallet…"
                                  value={packingForm.packageType}
                                  onChange={(event) => setPackingForm({ ...packingForm, packageType: event.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1 border-t">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPackingOrderId("")}
                                className="h-8 text-xs"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={busyPackingId === order.id || !packingForm.inspectionId || !Number(packingForm.quantity)}
                                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5"
                              >
                                {busyPackingId === order.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Save Packing Record
                              </Button>
                            </div>
                          </form>
                        )}

                        {/* Existing Packing Records */}
                        {(order.packingRecords || []).length === 0 ? (
                          <p className="rounded-xl border border-dashed border-border/80 p-3 text-xs text-muted-foreground text-center">
                            No packing records created yet. Quality-approved items can be packed once inspection passes.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {(order.packingRecords || []).map((record) => (
                              <div
                                key={record.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/70 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">
                                      {record.quantity} {order.unit}
                                    </span>
                                    <span className="text-muted-foreground">
                                      ({record.package_count} {record.package_type || "package"})
                                    </span>
                                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                      {record.status.replace(/_/g, " ")}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground text-[11px]">
                                    {record.remaining_quantity} units remaining to dispatch
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {record.status === "packing" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => void progressPacking(record.id, "packed")}
                                      disabled={Boolean(busyPackingId)}
                                      className="h-7 text-xs rounded-lg"
                                    >
                                      Mark Packed
                                    </Button>
                                  )}

                                  {record.status === "packed" && (
                                    <Button
                                      size="sm"
                                      onClick={() => void progressPacking(record.id, "ready_for_dispatch")}
                                      disabled={Boolean(busyPackingId)}
                                      className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                                    >
                                      Ready for Dispatch
                                    </Button>
                                  )}

                                  {record.status === "ready_for_dispatch" && Number(record.remaining_quantity) > 0 && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setDispatchTarget({
                                          order,
                                          packingId: record.id,
                                          remaining: Number(record.remaining_quantity),
                                        })
                                        setDispatchForm({
                                          quantity: String(record.remaining_quantity),
                                          deliveryReference: "",
                                          carrier: "",
                                        })
                                      }}
                                      className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1"
                                    >
                                      <Truck className="h-3 w-3" /> Dispatch Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* 🚚 Confirm Dispatch Dialog matching SmartERP UI Modal styling */}
        <Dialog open={Boolean(dispatchTarget)} onOpenChange={(open) => !open && !busyPackingId && setDispatchTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" /> Confirm Delivery Dispatch
              </DialogTitle>
              <DialogDescription className="text-xs">
                Finalize physical handover for order{" "}
                <strong className="text-foreground">{dispatchTarget?.order.orderNumber}</strong>.
              </DialogDescription>
            </DialogHeader>

            {dispatchTarget && (
              <div className="space-y-3.5 py-1 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                  <p className="font-semibold text-foreground">
                    Component: {dispatchTarget.order.componentName}
                  </p>
                  <p className="text-muted-foreground">
                    Client: {dispatchTarget.order.customerName} • Available to Dispatch:{" "}
                    <strong>{dispatchTarget.remaining} {dispatchTarget.order.unit}</strong>
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Quantity to Dispatch *</Label>
                  <Input
                    required
                    type="number"
                    min="0.001"
                    max={dispatchTarget.remaining}
                    step="0.001"
                    value={dispatchForm.quantity}
                    onChange={(event) => setDispatchForm({ ...dispatchForm, quantity: event.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Delivery Reference / DC Number (Optional)</Label>
                  <Input
                    maxLength={120}
                    placeholder="e.g. DC-2026-0042"
                    value={dispatchForm.deliveryReference}
                    onChange={(event) => setDispatchForm({ ...dispatchForm, deliveryReference: event.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Carrier / Transporter Details (Optional)</Label>
                  <Input
                    maxLength={120}
                    placeholder="e.g. Hand delivery, Customer pickup, DTDC Courier"
                    value={dispatchForm.carrier}
                    onChange={(event) => setDispatchForm({ ...dispatchForm, carrier: event.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDispatchTarget(null)}
                disabled={Boolean(busyPackingId)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void dispatch()}
                disabled={
                  !dispatchTarget ||
                  !Number(dispatchForm.quantity) ||
                  Number(dispatchForm.quantity) > (dispatchTarget?.remaining || 0) ||
                  Boolean(busyPackingId)
                }
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5"
              >
                {busyPackingId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                Confirm Dispatch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  )
}
