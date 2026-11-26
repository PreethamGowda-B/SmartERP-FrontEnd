"use client"

import React, { useState, useEffect, useCallback } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { Droplet } from "lucide-react"

export default function ConsumablesManagementPage() {
  const [consumables, setConsumables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConsumables = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success?: boolean; items?: any[] }>("/api/inventory")
      const items = Array.isArray(res) ? res : res?.items || []
      setConsumables(
        items.filter(
          (item: any) =>
            item.is_consumable === true ||
            ["oil", "grease", "coolant", "filter", "belt", "lubrication"].some((c) =>
              (item.category || item.name || "").toLowerCase().includes(c)
            )
        )
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to load consumables inventory")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConsumables()
  }, [fetchConsumables])

  return (
    <OwnerLayout>
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <Droplet className="h-7 w-7 text-blue-500" /> Consumables Inventory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track lubrication oils, greases, coolants, hydraulic fluids, filters, belts, and batteries separately from spares.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-12 text-slate-500">Loading consumables inventory...</div>
          ) : consumables.length === 0 ? (
            <Card className="col-span-3 p-12 text-center space-y-3">
              <Droplet className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Consumables Items Found</h3>
              <p className="text-xs text-slate-500">Tag inventory items as Consumables (Oil, Filters, Coolants) in the Inventory Module.</p>
            </Card>
          ) : (
            consumables.map((item) => (
              <Card key={item.id} className="p-5 border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">Category: {item.category || "Consumable"}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 font-bold border-blue-200">
                    Stock: {item.quantity || item.stock || 0}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </OwnerLayout>
  )
}
