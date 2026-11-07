"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { ShieldCheck, Plus, CheckCircle2, Package, RefreshCw, AlertCircle, Wrench } from "lucide-react"

export default function WarrantyClaimsPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // New Claim Modal
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    machine_id: "",
    spare_part_name: "",
    supplier_name: "",
    serial_number: "",
    failure_reason: "",
  })

  const fetchClaimsAndMachines = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError("")
      const [claimsRes, machinesRes] = await Promise.allSettled([
        apiClient<{ success: boolean; claims: any[] }>("/api/warranty-claims"),
        apiClient<{ success: boolean; machines: any[] }>("/api/machines").catch(() => ({ machines: [] })),
      ])

      if (claimsRes.status === "fulfilled" && claimsRes.value?.claims) {
        setClaims(claimsRes.value.claims)
      } else if (claimsRes.status === "rejected") {
        throw new Error(claimsRes.reason?.message || "Failed to load warranty claims.")
      }

      if (machinesRes.status === "fulfilled" && machinesRes.value?.machines) {
        setMachines(machinesRes.value.machines)
      }
    } catch (err: any) {
      setLoadError(err.message || "Failed to load warranty claims.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClaimsAndMachines()
  }, [fetchClaimsAndMachines])

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.machine_id) {
      toast.error("Please select a CNC machine.")
      return
    }
    if (!formData.spare_part_name.trim()) {
      toast.error("Spare part name is required.")
      return
    }
    if (!formData.supplier_name.trim()) {
      toast.error("Supplier / vendor name is required.")
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post("/api/warranty-claims", formData)
      toast.success("Supplier warranty claim filed successfully!")
      setIsAddOpen(false)
      setFormData({
        machine_id: "",
        spare_part_name: "",
        supplier_name: "",
        serial_number: "",
        failure_reason: "",
      })
      fetchClaimsAndMachines()
    } catch (err: any) {
      toast.error(err.message || "Failed to file warranty claim.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolveClaim = async (claimId: string, actionStatus: "approved" | "rejected") => {
    try {
      await apiClient(`/api/warranty-claims/${claimId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ status: actionStatus, credit_amount: actionStatus === "approved" ? 8500 : 0 }),
      })
      toast.success(actionStatus === "approved" ? "Warranty claim approved; supplier credit amount recorded." : "Warranty claim closed.")
      fetchClaimsAndMachines()
    } catch (err: any) {
      toast.error(err.message || "Failed to update claim")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-600" /> Supplier Warranty Lifecycle Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track spare part failures, RMA returns, supplier replacement claims, and recorded vendor credits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchClaimsAndMachines} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5">
            <Plus className="h-4 w-4" /> File Warranty Claim
          </Button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button type="button" variant="outline" onClick={fetchClaimsAndMachines} disabled={loading}>
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <p role="status" className="text-sm text-muted-foreground py-8 text-center">Loading warranty claims...</p>
        ) : loadError ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Warranty claims could not be loaded.</p>
        ) : claims.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 border-dashed">
            <ShieldCheck className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No active warranty claims logged</p>
            <p className="text-xs text-slate-400 mt-1">Click "File Warranty Claim" above to log a defective spare part or supplier RMA claim.</p>
          </Card>
        ) : (
          claims.map((c) => (
            <Card key={c.id} className="p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-xs transition-shadow">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {c.claim_number}
                  </span>
                  <Badge variant={c.status === "approved" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}>
                    {(c.status || "Submitted").replace(/_/g, " ").toUpperCase()}
                  </Badge>
                  {c.credit_amount && Number(c.credit_amount) > 0 && (
                    <Badge variant="outline" className="text-emerald-600 font-mono text-xs">
                      Credit: ₹{Number(c.credit_amount).toLocaleString("en-IN")}
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {c.spare_part_name} <span className="font-normal text-slate-500 text-xs">· Vendor: {c.supplier_name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Machine: <strong>{c.machine_name || "CNC Machine"}</strong> {c.serial_number ? `· S/N: ${c.serial_number}` : ""}
                  {c.failure_reason ? ` · Reason: ${c.failure_reason}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {c.status !== "approved" && c.status !== "rejected" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleResolveClaim(c.id, "approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve claim (₹8,500 supplier credit)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveClaim(c.id, "rejected")}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* File Warranty Claim Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> File Supplier Warranty Claim
            </DialogTitle>
            <DialogDescription>
              Submit a warranty return or defect claim for a failed component or spare part.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClaim} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>CNC Machine / System *</Label>
              <Select
                value={formData.machine_id}
                onValueChange={(val) => setFormData({ ...formData, machine_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select CNC machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.length === 0 ? (
                    <SelectItem value="none" disabled>No machines found in registry</SelectItem>
                  ) : (
                    machines.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.machine_name} ({m.make || "CNC"} - S/N: {m.serial_number})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Spare Part / Component *</Label>
                <Input
                  required
                  placeholder="e.g. Servo Drive 611"
                  value={formData.spare_part_name}
                  onChange={(e) => setFormData({ ...formData, spare_part_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Supplier / OEM *</Label>
                <Input
                  required
                  placeholder="e.g. Siemens / Fanuc"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Part Serial Number / Batch Code</Label>
              <Input
                placeholder="e.g. 6SN1123-1AA00-0DA1-Z"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Failure Description / Diagnostic Reason</Label>
              <Textarea
                placeholder="Describe failure symptom (e.g. IGBT power block short circuit under normal voltage, bearing seizure during test cycle)"
                value={formData.failure_reason}
                onChange={(e) => setFormData({ ...formData, failure_reason: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {submitting ? "Submitting Claim..." : "Submit Warranty Claim"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
