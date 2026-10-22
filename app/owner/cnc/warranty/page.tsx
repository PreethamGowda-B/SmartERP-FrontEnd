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
  const [loadError, setLoadError] = useState("")

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError("")
      const res = await apiClient<{ success: boolean; claims: any[] }>("/api/warranty-claims")
      if (!res?.success || !Array.isArray(res.claims)) throw new Error("The server returned an invalid warranty-claims response.")
      setClaims(res.claims)
    } catch (err: any) {
      setLoadError(err.message || "Failed to load warranty claims.")
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
      toast.success("Warranty claim approved; supplier credit amount recorded.")
      fetchClaims()
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve claim")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500" /> Supplier Warranty Lifecycle Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track spare part failures, supplier claim approvals, and recorded supplier credit amounts. No finance credit note was issued.
          </p>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button type="button" variant="outline" onClick={fetchClaims} disabled={loading}>
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <p role="status" className="text-sm text-muted-foreground">Loading warranty claims...</p>
        ) : loadError ? (
          <p className="text-sm text-muted-foreground">Warranty claims could not be loaded.</p>
        ) : claims.length === 0 ? (
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
                    <CheckCircle2 className="h-4 w-4" /> Approve claim (₹8,500 supplier credit)
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
