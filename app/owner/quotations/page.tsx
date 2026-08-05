"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { FileText, Plus, CheckCircle2, ArrowRight, DollarSign, Calculator, Cpu } from "lucide-react"

export default function ServiceQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Create Quotation Modal state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: "",
    machine_id: "",
    title: "",
    labor_amount: "5000",
    spares_amount: "12000",
    travel_amount: "2500",
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const qRes = await apiClient<{ success: boolean; quotations: any[] }>("/api/quotations")
      if (qRes?.quotations) setQuotations(qRes.quotations)

      const cRes = await apiClient<{ customers?: any[] }>("/api/customers")
      if (Array.isArray(cRes)) setCustomers(cRes)
      else if (cRes?.customers) setCustomers(cRes.customers)

      const mRes = await apiClient<{ success: boolean; machines: any[] }>("/api/machines")
      if (mRes?.machines) setMachines(mRes.machines)
    } catch (err: any) {
      toast.error(err.message || "Failed to load quotations")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiClient("/api/quotations", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          labor_amount: parseFloat(formData.labor_amount) || 0,
          spares_amount: parseFloat(formData.spares_amount) || 0,
          travel_amount: parseFloat(formData.travel_amount) || 0,
        }),
      })
      toast.success("Service Quotation created & sent to customer!")
      setIsAddOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to create quotation")
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveAndConvert = async (quotationId: string) => {
    try {
      const res = await apiClient<{ success: boolean; job: any }>(`/api/quotations/${quotationId}/approve`, {
        method: "POST",
      })
      toast.success("Quotation approved & converted to SmartERP Job!")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to convert quotation to job")
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Calculator className="h-8 w-8 text-amber-500" /> Service Quotations & Estimates (#28)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create service cost estimates, send to clients, and convert approved quotes directly to SmartERP Jobs
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Create Service Quotation
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading service quotations...</div>
      ) : quotations.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <FileText className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Service Quotations Found</h3>
          <p className="text-xs text-slate-500">Create pre-job service estimates to send to customers for approval.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {quotations.map((q) => (
            <Card key={q.id} className="p-5 border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                      {q.quotation_number}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{q.title}</h3>
                    <Badge
                      className={
                        q.status === "converted_to_job"
                          ? "bg-emerald-100 text-emerald-800 font-bold"
                          : "bg-blue-100 text-blue-800 font-bold"
                      }
                    >
                      {q.status === "converted_to_job" ? "🟢 Converted to Job" : "🔵 Sent / Pending Approval"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Customer: <strong>{q.customer_name || "Client"}</strong> • Machine: {q.machine_name || "General Service"}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Estimate</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">₹{q.total_amount}</p>
                    <p className="text-[10px] text-slate-400">
                      (Labor: ₹{q.labor_amount} • Spares: ₹{q.spares_amount} • Travel: ₹{q.travel_amount})
                    </p>
                  </div>

                  {q.status !== "converted_to_job" && (
                    <Button
                      onClick={() => handleApproveAndConvert(q.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve & Convert to Job
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Quotation Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-amber-500" /> Create Service Quotation
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateQuotation} className="space-y-4 my-2">
            <div className="space-y-2">
              <Label>Select Customer</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, customer_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quotation Title / Issue</Label>
              <Input
                placeholder="e.g. Spindle Motor Bearing Replacement & Laser Calibration"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Labor Cost (₹)</Label>
                <Input
                  type="number"
                  value={formData.labor_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, labor_amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Spares Cost (₹)</Label>
                <Input
                  type="number"
                  value={formData.spares_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, spares_amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Travel Cost (₹)</Label>
                <Input
                  type="number"
                  value={formData.travel_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, travel_amount: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {submitting ? "Creating..." : "Save & Send Quotation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
