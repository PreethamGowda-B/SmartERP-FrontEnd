"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package, Plus, Loader2, AlertTriangle, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { apiClient } from "@/lib/apiClient"

interface MaterialRequest {
  id: number
  item_name: string
  quantity: number
  urgency: "Low" | "Medium" | "High"
  description: string | null
  status: "pending" | "accepted" | "declined"
  requested_by_name: string
  created_at: string
}

const URGENCY_COLORS: Record<string, string> = {
  Low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  declined: {
    label: "Declined",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
}

const EMPTY_FORM = { item_name: "", quantity: "", urgency: "Medium", description: "" }

export default function EmployeeMaterialsPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const data = await apiClient("/api/material-requests")
      setRequests(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Material requests fetch error:", err)
      setFetchError(err.message || "Failed to load requests. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.item_name.trim()) {
      setSubmitError("Item name is required.")
      return
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      setSubmitError("Please enter a valid quantity.")
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await apiClient("/api/material-requests", {
        method: "POST",
        body: JSON.stringify({
          item_name: form.item_name.trim(),
          quantity: Number(form.quantity),
          urgency: form.urgency,
          description: form.description.trim() || null,
        }),
      })
      setSubmitSuccess(true)
      setForm(EMPTY_FORM)
      await loadRequests()
      // Auto-close dialog after 1s
      setTimeout(() => {
        setDialogOpen(false)
        setSubmitSuccess(false)
      }, 1200)
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit request.")
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const acceptedCount = requests.filter((r) => r.status === "accepted").length

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Material Requests
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Request materials needed for your work
            </p>
          </div>
          <Button onClick={() => { setDialogOpen(true); setSubmitError(null); setSubmitSuccess(false) }}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold">{requests.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-3xl font-bold text-green-600">{acceptedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Requests</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadRequests} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading requests...</span>
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-xs">{fetchError}</p>
                <Button variant="outline" size="sm" onClick={loadRequests}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <Package className="h-10 w-10 opacity-30" />
                <p className="text-sm">No requests yet. Create your first one!</p>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {requests.map((req) => {
                  const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending
                  return (
                    <div key={req.id} className="py-4 flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{req.item_name}</p>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${URGENCY_COLORS[req.urgency] || URGENCY_COLORS.Medium}`}>
                            {req.urgency}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Qty: <strong>{req.quantity}</strong>
                          {req.description && <> · {req.description}</>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setSubmitError(null); setSubmitSuccess(false) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Material Request</DialogTitle>
            <DialogDescription>
              Fill in the details below. Your owner will review and approve or decline.
            </DialogDescription>
          </DialogHeader>

          {submitSuccess ? (
            <div className="flex flex-col items-center py-6 gap-3 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
              <p className="font-medium">Request submitted successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="item_name">Item Name *</Label>
                <Input
                  id="item_name"
                  placeholder="e.g. Safety gloves, Paint brushes..."
                  value={form.item_name}
                  onChange={(e) => handleFieldChange("item_name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={form.quantity}
                    onChange={(e) => handleFieldChange("quantity", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={form.urgency} onValueChange={(v) => handleFieldChange("urgency", v)}>
                    <SelectTrigger id="urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Any specifications or special requirements..."
                  value={form.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  )
}
