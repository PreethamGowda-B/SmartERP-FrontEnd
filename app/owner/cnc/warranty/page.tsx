"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { ShieldCheck, Plus, CheckCircle2, Package, RefreshCw } from "lucide-react"

export default function WarrantyClaimsPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; claims: any[] }>("/api/warranty-claims")
      if (res?.claims) setClaims(res.claims)
    } catch (err: any) {
      toast.error(err.message || "Failed to load warranty claims")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  const handleResolveClaim = async (claimId: string) => {
    try {
      await apiClient(`/api/warranty-claims/${claimId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ status: "approved", credit_amount: 8500 }),
      })
      toast.success("Warranty claim approved & Credit Note issued!")
      fetchClaims()
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve claim")
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500" /> Supplier Warranty Lifecycle Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track spare part failures, supplier claim approvals, inventory updates, and financial credit notes
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {claims.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">No active warranty claims logged.</Card>
        ) : (
          claims.map((c) => (
            <Card key={c.id} className="p-5 border flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{c.claim_number}</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{c.spare_part_name}</h3>
                <p className="text-xs text-slate-500">Machine: {c.machine_name || "CNC Unit"} • Supplier: {c.supplier_name}</p>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={c.status === "approved" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}>
                  {c.status}
                </Badge>
                {c.status !== "approved" && (
                  <Button onClick={() => handleResolveClaim(c.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Issue Credit Note
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
