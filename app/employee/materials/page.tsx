"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package, Plus, Loader2, AlertTriangle, CheckCircle2, Clock, XCircle, RefreshCw, Box } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { apiClient } from "@/lib/apiClient"
import InventoryTable from "@/components/inventory-table"
import { cn } from "@/lib/utils"

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
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  declined: {
    label: "Declined",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  },
}

function EmployeeMaterialsPageContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "inventory" ? "inventory" : "requests"
  const [activeTab, setActiveTab] = useState<"requests" | "inventory">(initialTab as any)
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [itemName, setItemName] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [urgency, setUrgency] = useState<"Low" | "Medium" | "High">("Medium")
  const [description, setDescription] = useState("")

  const fetchRequests = useCallback(async () => {
    try {
      setRefreshing(true)
      const data = await apiClient<MaterialRequest[]>("/api/material-requests")
      setRequests(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Error fetching material requests:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim() || !quantity) return

    setSubmitting(true)
    try {
      await apiClient("/api/material-requests", {
        method: "POST",
        body: JSON.stringify({
          item_name: itemName.trim(),
          quantity: parseInt(quantity, 10) || 1,
          urgency,
          description: description.trim() || null,
        }),
      })

      // Reset form & reload
      setItemName("")
      setQuantity("1")
      setUrgency("Medium")
      setDescription("")
      setIsFormOpen(false)
      fetchRequests()
    } catch (err: any) {
      console.error("Error creating material request:", err)
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Materials & Supplies Command Center</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Request field tools, track fulfillment status, and inspect live company inventory levels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchRequests} disabled={refreshing} className="h-9 text-xs font-bold rounded-xl">
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin")} />
              Sync Supplies
            </Button>
            <Button size="sm" onClick={() => setIsFormOpen(true)} className="h-9 text-xs font-bold rounded-xl bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1.5" />
              New Material Request
            </Button>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-card rounded-2xl border border-border/70 shadow-xs">
          <Button
            variant={activeTab === "requests" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs font-bold rounded-xl px-4", activeTab === "requests" && "shadow-xs")}
            onClick={() => setActiveTab("requests")}
          >
            <Package className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            Material Requests ({requests.length})
            {pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[9px] font-black">
                {pendingCount} pending
              </span>
            )}
          </Button>

          <Button
            variant={activeTab === "inventory" ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs font-bold rounded-xl px-4", activeTab === "inventory" && "shadow-xs")}
            onClick={() => setActiveTab("inventory")}
          >
            <Box className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            Stock Viewer (Live Inventory)
          </Button>
        </div>

        {/* TAB 1: Material Requests */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-2xl border border-border/70 p-4">
                <div className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Requests</div>
                <div className="text-2xl font-black text-foreground mt-1">{requests.length}</div>
              </Card>

              <Card className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4">
                <div className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-300">Pending Approvals</div>
                <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{pendingCount}</div>
              </Card>

              <Card className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
                <div className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">Fulfilled & Accepted</div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{acceptedCount}</div>
              </Card>
            </div>

            {/* Request Cards List */}
            {loading ? (
              <div className="p-12 text-center text-xs font-bold text-muted-foreground">Loading material requests...</div>
            ) : requests.length === 0 ? (
              <Card className="rounded-2xl border border-border/70 p-12 text-center space-y-2">
                <Package className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-bold text-foreground">No material requests submitted yet</p>
                <p className="text-xs text-muted-foreground">Click "New Material Request" above to request job tools or stock.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map((req) => {
                  const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending
                  return (
                    <Card key={req.id} className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-foreground">{req.item_name}</h3>
                          <Badge variant="outline" className="text-[10px] font-bold">Qty: {req.quantity}</Badge>
                        </div>
                        <Badge className={cn("text-[10px] font-bold uppercase px-2 py-0.5 flex items-center gap-1", statusCfg.className)}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </Badge>
                      </div>

                      {req.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground pt-2 border-t border-border/40">
                        <span>Urgency: <span className={cn("px-1.5 py-0.2 rounded font-extrabold", URGENCY_COLORS[req.urgency])}>{req.urgency}</span></span>
                        <span>Requested {new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Live Stock Viewer */}
        {activeTab === "inventory" && (
          <Card className="rounded-2xl border border-border/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-foreground">Live Company Inventory Stock</h3>
                <p className="text-xs text-muted-foreground">Read-only view of stock quantities available in warehouse for dispatch.</p>
              </div>
            </div>
            <InventoryTable role="employee" refreshTrigger={0} onEdit={() => {}} />
          </Card>
        )}

        {/* Request Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-lg">New Material & Tool Request</DialogTitle>
              <DialogDescription className="text-xs">Submit a request for job-site tools, safety gear, or consumables.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Item Name / Tool Model</Label>
                <Input placeholder="e.g. Copper Wiring Coil 50m" value={itemName} onChange={(e) => setItemName(e.target.value)} required className="h-9 text-xs rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Quantity</Label>
                  <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="h-9 text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Urgency</Label>
                  <Select value={urgency} onValueChange={(val: any) => setUrgency(val)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="High">High Priority (Urgent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Job Reason / Notes</Label>
                <Textarea placeholder="Explain which job or site requires this material..." value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs rounded-xl min-h-[80px]" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)} className="h-8 text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs font-bold bg-primary text-primary-foreground px-4">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Submit Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  )
}

export default function EmployeeMaterialsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-muted-foreground">Loading materials & supplies...</div>}>
      <EmployeeMaterialsPageContent />
    </Suspense>
  )
}
