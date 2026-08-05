"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { ShoppingBag, Plus, Star, Package, FileText } from "lucide-react"

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [pos, setPos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; vendors: any[]; purchase_orders: any[] }>("/api/vendors")
      if (res?.vendors) setVendors(res.vendors)
      if (res?.purchase_orders) setPos(res.purchase_orders)
    } catch (err: any) {
      toast.error(err.message || "Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleCreatePo = async () => {
    try {
      await apiClient("/api/vendors/po", {
        method: "POST",
        body: JSON.stringify({
          vendor_name: "Fanuc India Spares Ltd",
          parts_description: "Spindle Servo Motor 7.5kW (A06B-0238-B200)",
          total_cost: 45000,
        }),
      })
      toast.success("Purchase Order issued!")
      fetchVendors()
    } catch (err: any) {
      toast.error(err.message || "Failed to issue PO")
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-amber-500" /> CNC Spare Part Vendors & Purchase Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage spare part suppliers, issue purchase orders, and track replacement stock deliveries
          </p>
        </div>
        <Button onClick={handleCreatePo} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Issue Purchase Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold">Approved CNC Vendors</CardTitle>
            <CardDescription>Verified suppliers for Fanuc, Siemens, and Mitsubishi parts</CardDescription>
          </CardHeader>
          <div className="space-y-3 pt-2">
            {vendors.length === 0 ? (
              <p className="text-xs text-slate-400">Fanuc India Spares • Siemens Automation Direct • Mitsubishi Electric Services</p>
            ) : (
              vendors.map((v) => (
                <div key={v.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{v.vendor_name}</h4>
                    <p className="text-xs text-slate-500">{v.contact_person} • {v.phone}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500" /> {v.rating || 4.8}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold">Issued Purchase Orders</CardTitle>
            <CardDescription>Spare part procurement and cost tracking</CardDescription>
          </CardHeader>
          <div className="space-y-3 pt-2">
            {pos.length === 0 ? (
              <p className="text-xs text-slate-400">No active purchase orders issued.</p>
            ) : (
              pos.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-600">{p.po_number}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{p.parts_description}</h4>
                    <p className="text-xs text-slate-500">Supplier: {p.vendor_name}</p>
                  </div>
                  <span className="font-black text-sm text-emerald-600">₹{Number(p.total_cost).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
