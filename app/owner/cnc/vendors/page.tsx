"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { ShoppingBag, Plus, Star } from "lucide-react"

type PurchaseOrder = {
  id: string | number
  po_number: string
  vendor_name: string
  parts_description: string
  total_cost: number | string
}

type PurchaseOrderDraft = {
  vendor_name: string
  parts_description: string
  total_cost: string
  job_id: string
}

const EMPTY_DRAFT: PurchaseOrderDraft = {
  vendor_name: "",
  parts_description: "",
  total_cost: "",
  job_id: "",
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [dialogStep, setDialogStep] = useState<"form" | "review" | null>(null)
  const [draft, setDraft] = useState<PurchaseOrderDraft>(EMPTY_DRAFT)
  const [submitting, setSubmitting] = useState(false)

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError("")
      const res = await apiClient<{ success: boolean; vendors: any[]; purchase_orders: PurchaseOrder[] }>("/api/vendors")
      if (!res?.success || !Array.isArray(res.vendors) || !Array.isArray(res.purchase_orders)) {
        throw new Error("The server returned an invalid vendor response.")
      }
      setVendors(res.vendors)
      setPos(res.purchase_orders)
    } catch (err: any) {
      setLoadError(err.message || "Failed to load CNC vendor data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const openPurchaseOrderForm = () => {
    setDraft(EMPTY_DRAFT)
    setDialogStep("form")
  }

  const handleReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const totalCost = Number(draft.total_cost)
    if (!draft.vendor_name.trim() || !draft.parts_description.trim() || draft.total_cost.trim() === "" || !Number.isFinite(totalCost) || totalCost < 0) {
      toast.error("Enter a supplier, part description, and a valid non-negative amount.")
      return
    }
    setDialogStep("review")
  }

  const handleCreatePo = async () => {
    if (submitting) return
    const totalCost = Number(draft.total_cost)
    if (!draft.vendor_name.trim() || !draft.parts_description.trim() || !Number.isFinite(totalCost) || totalCost < 0) {
      toast.error("Review the required purchase-order details before submitting.")
      setDialogStep("form")
      return
    }

    setSubmitting(true)
    try {
      const response = await apiClient<{ success: boolean; purchase_order?: PurchaseOrder; message?: string }>("/api/vendors/po", {
        method: "POST",
        body: JSON.stringify({
          vendor_name: draft.vendor_name.trim(),
          parts_description: draft.parts_description.trim(),
          total_cost: totalCost,
          ...(draft.job_id.trim() ? { job_id: Number(draft.job_id) } : {}),
        }),
      })
      if (!response?.success || !response.purchase_order?.id || !response.purchase_order.po_number) {
        throw new Error(response?.message || "The server did not confirm the purchase order.")
      }

      setPos((current) => [response.purchase_order!, ...current])
      toast.success(`Purchase order ${response.purchase_order.po_number} created.`)
      setDialogStep(null)
      setDraft(EMPTY_DRAFT)
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase order.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-amber-500" /> CNC Spare Part Vendors & Purchase Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage supplier records and review purchase-order details before they are submitted.
          </p>
        </div>
        <Button onClick={openPurchaseOrderForm} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Issue Purchase Order
        </Button>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button type="button" variant="outline" onClick={fetchVendors} disabled={loading}>
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold">Approved CNC Vendors</CardTitle>
            <CardDescription>Supplier records available to this company</CardDescription>
          </CardHeader>
          <div className="space-y-3 pt-2">
            {loading ? (
              <p role="status" className="text-sm text-muted-foreground">Loading vendors...</p>
            ) : loadError ? (
              <p className="text-sm text-muted-foreground">Vendor records could not be loaded.</p>
            ) : vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendor records are available.</p>
            ) : (
              vendors.map((vendor) => (
                <div key={vendor.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{vendor.vendor_name}</h4>
                    <p className="text-xs text-slate-500">{vendor.contact_person} {vendor.phone ? `• ${vendor.phone}` : ""}</p>
                  </div>
                  {vendor.rating && (
                    <Badge className="bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-500" /> {vendor.rating}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold">Issued Purchase Orders</CardTitle>
            <CardDescription>Purchase orders returned by the server</CardDescription>
          </CardHeader>
          <div className="space-y-3 pt-2">
            {loading ? (
              <p role="status" className="text-sm text-muted-foreground">Loading purchase orders...</p>
            ) : loadError ? (
              <p className="text-sm text-muted-foreground">Purchase orders could not be loaded.</p>
            ) : pos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No purchase orders have been issued.</p>
            ) : (
              pos.map((po) => (
                <div key={po.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-600">{po.po_number}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{po.parts_description}</h4>
                    <p className="text-xs text-slate-500">Supplier: {po.vendor_name}</p>
                  </div>
                  <span className="font-black text-sm text-emerald-600 whitespace-nowrap">₹{Number(po.total_cost).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Dialog
        open={dialogStep !== null}
        onOpenChange={(open) => {
          if (!open && !submitting) {
            setDialogStep(null)
            setDraft(EMPTY_DRAFT)
          }
        }}
      >
        <DialogContent>
          {dialogStep === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle>New purchase order</DialogTitle>
                <DialogDescription>Enter the actual supplier and order details. Nothing is submitted until you review and confirm.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleReview} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="po-vendor">Supplier</Label>
                  <Input id="po-vendor" name="vendor_name" maxLength={255} required value={draft.vendor_name} onChange={(e) => setDraft({ ...draft, vendor_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="po-description">Part description</Label>
                  <Input id="po-description" name="parts_description" required value={draft.parts_description} onChange={(e) => setDraft({ ...draft, parts_description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="po-cost">Total amount (₹)</Label>
                  <Input id="po-cost" name="total_cost" type="number" min="0" max="9999999999.99" step="0.01" required value={draft.total_cost} onChange={(e) => setDraft({ ...draft, total_cost: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="po-job-id">Job ID (optional)</Label>
                  <Input id="po-job-id" name="job_id" type="number" min="1" step="1" value={draft.job_id} onChange={(e) => setDraft({ ...draft, job_id: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogStep(null)}>Cancel</Button>
                  <Button type="submit">Review purchase order</Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Review purchase order</DialogTitle>
                <DialogDescription>Confirm these details to create the issued purchase order.</DialogDescription>
              </DialogHeader>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-muted-foreground">Supplier</dt><dd className="font-medium">{draft.vendor_name.trim()}</dd></div>
                <div><dt className="text-muted-foreground">Part description</dt><dd className="font-medium">{draft.parts_description.trim()}</dd></div>
                <div><dt className="text-muted-foreground">Total amount</dt><dd className="font-medium">₹{Number(draft.total_cost).toLocaleString()}</dd></div>
                {draft.job_id.trim() && <div><dt className="text-muted-foreground">Job ID</dt><dd className="font-medium">{draft.job_id}</dd></div>}
              </dl>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={submitting} onClick={() => setDialogStep("form")}>Edit details</Button>
                <Button type="button" disabled={submitting} onClick={handleCreatePo}>
                  {submitting ? "Submitting..." : "Confirm and issue"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
