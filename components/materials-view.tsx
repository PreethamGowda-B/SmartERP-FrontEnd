"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Search, Loader2, Check, X, Clock } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { ExportButton } from "@/components/export-button"
import { cn } from "@/lib/utils"
import { EnterpriseDataTable } from "@/components/data-table/enterprise-data-table"
import { MaterialPurchaseReviewDialog } from "@/components/material-purchase-review-dialog"

interface MaterialRequest {
  id: number
  item_name: string
  quantity: number
  unit?: string | null
  urgency: string
  description: string
  status: string
  purchase_status?: string | null
  requested_by_name: string
  reviewed_by_name?: string | null
  reviewed_at?: string | null
  created_at: string
}

export function MaterialsView() {
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Fetch all material requests
  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await apiClient("/api/material-requests")
      setRequests(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Accept request
  const handleAccept = async (requestId: number) => {
    setProcessing(requestId)
    setError(null)
    try {
      await apiClient(`/api/material-requests/${requestId}/accept`, {
        method: "PATCH",
      })
      await fetchRequests()
    } catch (err: any) {
      setError(err.message || "Failed to accept request")
    } finally {
      setProcessing(null)
    }
  }

  // Decline request
  const handleDecline = async (requestId: number) => {
    setProcessing(requestId)
    setError(null)
    try {
      await apiClient(`/api/material-requests/${requestId}/decline`, {
        method: "PATCH",
      })
      await fetchRequests()
    } catch (err: any) {
      setError(err.message || "Failed to decline request")
    } finally {
      setProcessing(null)
    }
  }

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      (request.item_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.requested_by_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const pendingCount = requests.filter((r) => r.status === "pending").length
  const acceptedCount = requests.filter((r) => r.status === "accepted").length
  const declinedCount = requests.filter((r) => r.status === "declined").length

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "urgent":
        return "text-red-600 font-semibold"
      case "high":
        return "text-orange-600 font-medium"
      case "medium":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Material Requests & Requisitions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review and authorize raw material, component, and spare-parts requests from workshop engineers.
          </p>
        </div>
        <ExportButton
          filename="Material_Requests_Report"
          title="Material Requests Report"
          subtitle={`Procurement & Supply Chain Analysis`}
          onExport={async () => {
            const data = await apiClient("/api/material-requests")
            return Array.isArray(data) ? data : []
          }}
          columns={[
            { header: "Item Name", dataKey: "item_name" },
            { header: "Requested By", dataKey: "requested_by_name" },
            { header: "Qty", dataKey: "quantity", type: "number" },
            { header: "Urgency", dataKey: "urgency" },
            { header: "Status", dataKey: "status" },
            { header: "Description", dataKey: "description" },
            { header: "Requested Date", dataKey: "created_at", type: "date" }
          ]}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">&times;</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-black">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">Approved</p>
                <p className="text-2xl font-black">{acceptedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600">
                <X className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">Declined</p>
                <p className="text-2xl font-black">{declinedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search material requests by item name, department, or employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9 text-xs rounded-xl">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Table */}
      <Card className="border border-border/70 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <EnterpriseDataTable<MaterialRequest>
            data={filteredRequests}
            columns={[
              {
                id: "item_name",
                header: "Requested Item",
                accessorKey: "item_name",
                enableSorting: true,
                cell: (req) => (
                  <div>
                    <div className="font-semibold text-xs text-foreground">{req.item_name}</div>
                    {req.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{req.description}</p>
                    )}
                  </div>
                ),
              },
              {
                id: "requested_by",
                header: "Requested By",
                accessorKey: "requested_by_name",
                enableSorting: true,
                cell: (req) => <span className="text-xs font-medium">{req.requested_by_name}</span>,
              },
              {
                id: "quantity",
                header: "Quantity",
                accessorKey: "quantity",
                enableSorting: true,
                cell: (req) => <span className="font-bold text-xs">{req.quantity} {req.unit || ""}</span>,
              },
              {
                id: "urgency",
                header: "Urgency",
                accessorKey: "urgency",
                enableSorting: true,
                cell: (req) => (
                  <span className={cn("text-xs font-medium capitalize", getUrgencyColor(req.urgency))}>
                    {req.urgency}
                  </span>
                ),
              },
              {
                id: "status",
                header: "Status",
                accessorKey: "status",
                enableSorting: true,
                cell: (req) => (
                  <Badge className={cn("text-xs capitalize", getStatusColor(req.status))}>
                    {req.status ? req.status : "Pending"}
                  </Badge>
                ),
              },
              {
                id: "date",
                header: "Requested Date",
                accessorKey: "created_at",
                enableSorting: true,
                cell: (req) => (
                  <span className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                ),
              },
              {
                id: "actions",
                header: "Actions",
                enableSorting: false,
                enableHiding: false,
                headerClassName: "text-right",
                cell: (req) => (
                  <div className="flex items-center gap-1.5 justify-end">
                    {req.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold"
                          onClick={() => handleAccept(req.id)}
                          disabled={processing === req.id}
                        >
                          {processing === req.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" /> Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 text-rose-600 hover:bg-rose-50 font-bold"
                          onClick={() => handleDecline(req.id)}
                          disabled={processing === req.id}
                        >
                          {processing === req.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <X className="h-3 w-3 mr-1" /> Decline
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {req.purchase_status && <span className="max-w-32 text-right text-[10px] capitalize text-muted-foreground">{req.purchase_status.replaceAll("_", " ")}</span>}
                        {(req.status === "accepted" || Boolean(req.purchase_status)) && <MaterialPurchaseReviewDialog request={req} onUpdated={fetchRequests} />}
                        {!req.purchase_status && req.status !== "accepted" && <span className="text-xs text-muted-foreground font-medium">—</span>}
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
            getRowId={(req) => String(req.id)}
            searchPlaceholder="Search material requests by item or requester..."
            isLoading={loading}
            storageKey="owner_materials_table"
            emptyTitle="No material requests found"
            emptyDescription="No material requests have been submitted yet."
            emptyIcon={Package}
          />
        </CardContent>
      </Card>
    </div>
  )
}
