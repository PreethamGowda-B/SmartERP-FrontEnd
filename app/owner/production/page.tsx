"use client"

import React, { FormEvent, useCallback, useEffect, useState } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  createProductionOrder,
  getProductionDashboard,
  getProductionOrder,
  getProductionOrders,
  getProductionReferences,
  ProductionDashboard,
  ProductionOrder,
  ProductionOrderDetail,
  ProductionReferences,
  ProductionStatus,
  inspectProductionBatch,
  createProductionPackingRecord,
  advanceProductionPacking,
  confirmProductionDispatch,
} from "@/lib/production-dispatch-api"
import {
  Factory,
  Plus,
  RefreshCw,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Eye,
  Loader2,
  ArrowRight,
  PackageCheck,
  Send,
} from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  planned: { label: "Planned", badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  in_production: { label: "In Production / Repair", badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  quality_check: { label: "Testing / QC", badgeClass: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  ready_for_dispatch: { label: "Ready for Dispatch", badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold" },
  partially_dispatched: { label: "Partially Dispatched", badgeClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300" },
  dispatched: { label: "Dispatched", badgeClass: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 font-bold" },
}

export default function StreamlinedProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [dashboard, setDashboard] = useState<ProductionDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Quick Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [references, setReferences] = useState<ProductionReferences | null>(null)
  const [quickForm, setQuickForm] = useState({
    customerId: "",
    componentName: "",
    plannedQuantity: 1,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    assignedEmployeeId: "",
    instructions: "",
  })

  // Quick Dispatch Modal State
  const [dispatchOrder, setDispatchOrder] = useState<ProductionOrder | null>(null)
  const [dispatching, setDispatching] = useState(false)
  const [deliveryRef, setDeliveryRef] = useState("")
  const [carrier, setCarrier] = useState("")

  // Details Modal State
  const [detailOrder, setDetailOrder] = useState<ProductionOrderDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const [dash, listRes, refs] = await Promise.allSettled([
        getProductionDashboard(),
        getProductionOrders({ page: 1, pageSize: 50, q: searchQuery }),
        getProductionReferences(),
      ])

      if (dash.status === "fulfilled") setDashboard(dash.value)
      if (listRes.status === "fulfilled") setOrders(listRes.value?.orders || [])
      if (refs.status === "fulfilled") setReferences(refs.value)
    } catch (err: any) {
      setError(err?.message || "Failed to load production orders")
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "in_production" && (o.status === "in_production" || o.status === "planned")) ||
      (statusFilter === "ready_for_dispatch" && (o.status === "ready_for_dispatch" || o.status === "quality_check")) ||
      (statusFilter === "dispatched" && (o.status === "dispatched" || o.status === "partially_dispatched"))

    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      (o.orderNumber || "").toLowerCase().includes(q) ||
      (o.componentName || "").toLowerCase().includes(q) ||
      (o.customerName || "").toLowerCase().includes(q) ||
      (o.partNumber || "").toLowerCase().includes(q)

    return matchesStatus && matchesSearch
  })

  // Quick Order Creation
  const handleQuickCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!quickForm.customerId) {
      toast.error("Please select a customer.")
      return
    }
    if (!quickForm.componentName.trim()) {
      toast.error("Component or Drive model is required.")
      return
    }

    setCreating(true)
    try {
      const generatedPartNumber = `PART-${Date.now().toString().slice(-6)}`
      await createProductionOrder({
        customerId: quickForm.customerId,
        componentName: quickForm.componentName.trim(),
        partNumber: generatedPartNumber,
        plannedQuantity: Number(quickForm.plannedQuantity) || 1,
        unit: "pieces",
        dueDate: quickForm.dueDate,
        priority: quickForm.priority,
        assignedEmployeeId: quickForm.assignedEmployeeId || undefined,
        instructions: quickForm.instructions.trim() || undefined,
      })

      toast.success("Production & Repair order created successfully!")
      setIsCreateOpen(false)
      setQuickForm({
        customerId: "",
        componentName: "",
        plannedQuantity: 1,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        priority: "medium",
        assignedEmployeeId: "",
        instructions: "",
      })
      loadData()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create order.")
    } finally {
      setCreating(false)
    }
  }

  // Fast-track Order: Move Planned to In-Production, or In-Production to Ready for Dispatch
  const handleAdvanceStatus = async (order: ProductionOrder, target: "ready_for_dispatch" | "dispatched") => {
    try {
      toast.loading("Updating order status...", { id: "order-status" })
      // Fetch full order to obtain batches and inspections
      const detail = await getProductionOrder(order.id)

      if (target === "ready_for_dispatch") {
        // Step 1: Inspect batch if needed
        let inspectionId = detail.inspections?.[0]?.id
        if (!inspectionId && detail.batches?.[0]?.id) {
          const insp = await inspectProductionBatch(detail.batches[0].id, {
            acceptedQuantity: order.plannedQuantity,
            rejectedQuantity: 0,
            reworkQuantity: 0,
            reason: "Passed bench testing and QC verification",
          })
          inspectionId = insp.inspection?.id
        }

        // Step 2: Create packing record if not ready
        let packingId = detail.packingRecords?.[0]?.id
        if (!packingId && inspectionId) {
          const pack = await createProductionPackingRecord(order.id, {
            inspectionId,
            quantity: order.plannedQuantity,
            packageCount: 1,
            packageType: "Box / Crate",
          })
          packingId = pack.packingRecord?.id
        }

        // Step 3: Advance packing to ready
        if (packingId) {
          await advanceProductionPacking(packingId, "packed").catch(() => {})
          await advanceProductionPacking(packingId, "ready_for_dispatch").catch(() => {})
        }

        toast.success(`Order ${order.orderNumber} is now Ready for Dispatch!`, { id: "order-status" })
        loadData()
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to advance order", { id: "order-status" })
    }
  }

  // One-Click Fast Dispatch
  const handleConfirmDispatch = async () => {
    if (!dispatchOrder) return
    setDispatching(true)
    try {
      toast.loading(`Confirming dispatch for ${dispatchOrder.orderNumber}...`, { id: "dispatch-toast" })
      const detail = await getProductionOrder(dispatchOrder.id)

      // Find or create packing record
      let packingId = detail.packingRecords?.[0]?.id
      if (!packingId) {
        let inspectionId = detail.inspections?.[0]?.id
        if (!inspectionId && detail.batches?.[0]?.id) {
          const insp = await inspectProductionBatch(detail.batches[0].id, {
            acceptedQuantity: dispatchOrder.plannedQuantity,
            rejectedQuantity: 0,
            reworkQuantity: 0,
            reason: "Passed final dispatch inspection",
          })
          inspectionId = insp.inspection?.id
        }
        if (inspectionId) {
          const pack = await createProductionPackingRecord(dispatchOrder.id, {
            inspectionId,
            quantity: dispatchOrder.plannedQuantity,
            packageCount: 1,
          })
          packingId = pack.packingRecord?.id
          if (packingId) {
            await advanceProductionPacking(packingId, "packed").catch(() => {})
            await advanceProductionPacking(packingId, "ready_for_dispatch").catch(() => {})
          }
        }
      }

      await confirmProductionDispatch(dispatchOrder.id, {
        packingRecordId: packingId,
        quantity: dispatchOrder.outstandingQuantity || dispatchOrder.plannedQuantity,
        confirmed: true,
        deliveryReference: deliveryRef.trim() || undefined,
        carrier: carrier.trim() || undefined,
      })

      toast.success(`Order ${dispatchOrder.orderNumber} successfully dispatched!`, { id: "dispatch-toast" })
      setDispatchOrder(null)
      setDeliveryRef("")
      setCarrier("")
      loadData()
    } catch (err: any) {
      toast.error(err?.message || "Dispatch confirmation failed", { id: "dispatch-toast" })
    } finally {
      setDispatching(false)
    }
  }

  const openDetails = async (orderId: string) => {
    setLoadingDetail(true)
    try {
      const d = await getProductionOrder(orderId)
      setDetailOrder(d)
    } catch (err: any) {
      toast.error(err?.message || "Failed to load order details")
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto p-2 sm:p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <Factory className="h-8 w-8 text-emerald-600" /> Production & Dispatch
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Streamlined CNC machining, drive repair workflow, bench testing, and quick delivery dispatches
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> New Production / Repair Order
            </Button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Clean Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            onClick={() => setStatusFilter("all")}
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "all" ? "border-emerald-500 ring-2 ring-emerald-500/20" : ""}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Orders</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {dashboard ? Object.values(dashboard.counts).reduce((a, b) => a + b, 0) : orders.length}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600">
                <Factory className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setStatusFilter("in_production")}
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "in_production" ? "border-blue-500 ring-2 ring-blue-500/20" : ""}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase">In Production / Repair</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {dashboard ? (dashboard.counts["in_production"] || 0) + (dashboard.counts["planned"] || 0) : 0}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <Wrench className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setStatusFilter("ready_for_dispatch")}
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "ready_for_dispatch" ? "border-emerald-500 ring-2 ring-emerald-500/20" : ""}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase">Ready for Dispatch</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {dashboard ? (dashboard.counts["ready_for_dispatch"] || 0) + (dashboard.counts["quality_check"] || 0) : 0}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <PackageCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setStatusFilter("dispatched")}
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "dispatched" ? "border-green-500 ring-2 ring-green-500/20" : ""}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase">Dispatched / Completed</p>
                <h3 className="text-2xl font-black text-green-700 mt-1">
                  {dashboard ? (dashboard.counts["dispatched"] || 0) + (dashboard.counts["partially_dispatched"] || 0) : 0}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-700">
                <Truck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter:</span>
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="text-xs h-8"
            >
              All Orders
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "in_production" ? "default" : "outline"}
              onClick={() => setStatusFilter("in_production")}
              className="text-xs h-8"
            >
              In Production
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "ready_for_dispatch" ? "default" : "outline"}
              onClick={() => setStatusFilter("ready_for_dispatch")}
              className="text-xs h-8"
            >
              Ready for Dispatch
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "dispatched" ? "default" : "outline"}
              onClick={() => setStatusFilter("dispatched")}
              className="text-xs h-8"
            >
              Dispatched
            </Button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search component, order, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Orders Table */}
        <Card className="border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Order / Client</th>
                  <th className="px-4 py-3.5">Component / Drive Model</th>
                  <th className="px-4 py-3.5">Quantity</th>
                  <th className="px-4 py-3.5">Due Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading production orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Factory className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No orders found</p>
                      <p className="text-xs text-slate-400 mt-1">Click "New Production / Repair Order" above to log a job.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusInfo = STATUS_CONFIG[order.status] || {
                      label: order.status.replace(/_/g, " "),
                      badgeClass: "bg-slate-100 text-slate-700",
                    }

                    const isReadyToDispatch = order.status === "ready_for_dispatch" || order.status === "quality_check"
                    const isInProgress = order.status === "in_production" || order.status === "planned"
                    const isDispatched = order.status === "dispatched" || order.status === "partially_dispatched"

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                            {order.orderNumber}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{order.customerName || "Customer Facility"}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{order.componentName}</div>
                          <div className="text-[11px] text-slate-400">
                            Operator: {order.assignedEmployeeName || "Unassigned"}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {order.plannedQuantity} {order.unit || "pcs"}
                          </div>
                          {order.dispatchedQuantity > 0 && (
                            <div className="text-[11px] text-emerald-600 font-medium">
                              {order.dispatchedQuantity} dispatched
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {order.dueDate ? new Date(order.dueDate).toLocaleDateString("en-IN") : "—"}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isInProgress && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAdvanceStatus(order, "ready_for_dispatch")}
                                className="h-8 text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Mark Ready
                              </Button>
                            )}

                            {isReadyToDispatch && (
                              <Button
                                size="sm"
                                onClick={() => setDispatchOrder(order)}
                                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs"
                              >
                                <Truck className="h-3.5 w-3.5" /> Dispatch
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDetails(order.id)}
                              className="h-8 text-xs text-slate-500 hover:text-slate-900"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 🚀 Quick Create Order Dialog (Simplified 5-6 Fields!) */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Factory className="h-5 w-5 text-emerald-600" /> New Production / Repair Order
              </DialogTitle>
              <DialogDescription>
                Create a manufacturing or drive repair order. Quick defaults apply automatically.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleQuickCreate} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Customer / Client Facility *</Label>
                <Select
                  value={quickForm.customerId}
                  onValueChange={(val) => setQuickForm({ ...quickForm, customerId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client or customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {!references?.customers.length ? (
                      <SelectItem value="none" disabled>No customers available</SelectItem>
                    ) : (
                      references.customers.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Component / Drive Model *</Label>
                <Input
                  required
                  placeholder="e.g. Siemens 611 Power Drive, Fanuc Spindle Motor, Fixture Base"
                  value={quickForm.componentName}
                  onChange={(e) => setQuickForm({ ...quickForm, componentName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Quantity *</Label>
                  <Input
                    required
                    type="number"
                    min="1"
                    value={quickForm.plannedQuantity}
                    onChange={(e) => setQuickForm({ ...quickForm, plannedQuantity: Number(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Target Due Date *</Label>
                  <Input
                    required
                    type="date"
                    value={quickForm.dueDate}
                    onChange={(e) => setQuickForm({ ...quickForm, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Assigned Technician</Label>
                  <Select
                    value={quickForm.assignedEmployeeId}
                    onValueChange={(val) => setQuickForm({ ...quickForm, assignedEmployeeId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {(references?.employees || []).map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={quickForm.priority}
                    onValueChange={(val) => setQuickForm({ ...quickForm, priority: val as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Normal / Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Repair Notes / Symptoms (Optional)</Label>
                <Textarea
                  placeholder="e.g. Over-voltage trip error F011, customer reports intermittent overheating."
                  value={quickForm.instructions}
                  onChange={(e) => setQuickForm({ ...quickForm, instructions: e.target.value })}
                  rows={2}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {creating ? "Creating Order..." : "Create Order"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 🚚 Quick 1-Click Dispatch Confirmation Modal */}
        <Dialog open={Boolean(dispatchOrder)} onOpenChange={(open) => !open && setDispatchOrder(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" /> Confirm Delivery Dispatch
              </DialogTitle>
              <DialogDescription>
                Dispatch order <strong className="text-slate-900 dark:text-white">{dispatchOrder?.orderNumber}</strong> to{" "}
                {dispatchOrder?.customerName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Component: {dispatchOrder?.componentName}
                </p>
                <p className="text-emerald-700 dark:text-emerald-400">
                  Quantity to Ship: {dispatchOrder?.outstandingQuantity || dispatchOrder?.plannedQuantity} {dispatchOrder?.unit || "pieces"}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Delivery Reference / DC Number (Optional)</Label>
                <Input
                  placeholder="e.g. DC-2026-089"
                  value={deliveryRef}
                  onChange={(e) => setDeliveryRef(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Transporter / Delivery Person (Optional)</Label>
                <Input
                  placeholder="e.g. In-House Hand Delivery / DTDC Express"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDispatchOrder(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={dispatching}
                onClick={handleConfirmDispatch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {dispatching ? "Dispatching..." : "Confirm Dispatch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 👁️ Order Details Dialog */}
        <Dialog open={Boolean(detailOrder)} onOpenChange={(open) => !open && setDetailOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Factory className="h-5 w-5 text-emerald-600" /> Order Details: {detailOrder?.order.orderNumber}
              </DialogTitle>
              <DialogDescription>
                Full lifecycle details, inspections, and dispatch history.
              </DialogDescription>
            </DialogHeader>

            {detailOrder && (
              <div className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div>
                    <span className="text-slate-400">Customer:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailOrder.order.customerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Component:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailOrder.order.componentName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <p className="font-semibold text-emerald-600 mt-0.5">{(detailOrder.order.status || "").toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Due Date:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {detailOrder.order.dueDate ? new Date(detailOrder.order.dueDate).toLocaleDateString("en-IN") : "—"}
                    </p>
                  </div>
                </div>

                {(detailOrder.order as any).instructions && (
                  <div>
                    <span className="font-semibold text-slate-600">Instructions / Notes:</span>
                    <p className="mt-1 p-2 rounded bg-slate-50 dark:bg-slate-900 border text-slate-700 dark:text-slate-300">
                      {(detailOrder.order as any).instructions}
                    </p>
                  </div>
                )}

                {/* Dispatches history */}
                <div>
                  <span className="font-semibold text-slate-600">Shipments & Dispatches ({detailOrder.dispatches.length}):</span>
                  {detailOrder.dispatches.length === 0 ? (
                    <p className="text-slate-400 mt-1 italic">No shipments recorded yet.</p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {detailOrder.dispatches.map((d) => (
                        <div key={d.id} className="p-2.5 rounded border bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                          <div>
                            <span className="font-mono font-bold text-emerald-600">{d.dispatch_reference}</span>
                            <span className="text-slate-500 ml-2">Qty: {d.quantity} {detailOrder.order.unit}</span>
                          </div>
                          <span className="text-slate-400">{d.dispatched_at ? new Date(d.dispatched_at).toLocaleDateString("en-IN") : "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" onClick={() => setDetailOrder(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
