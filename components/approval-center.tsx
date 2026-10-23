"use client"

import * as React from "react"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  Package,
  CreditCard,
  Calendar,
  Briefcase,
  Users,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnterpriseDataTable } from "@/components/data-table/enterprise-data-table"
import type { ColumnDef } from "@/components/data-table/data-table-types"

export interface ApprovalItem {
  id: string
  title: string
  category: "Material Request" | "Leave Request" | "Payroll Approval" | "Job Approval" | "Work Request"
  requester: string
  requestedDate: string
  amountOrQty?: string
  status: "pending" | "approved" | "rejected"
  details: string
}

export function ApprovalCenter() {
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [busyIds, setBusyIds] = React.useState<Set<string>>(new Set())
  const busyIdsRef = React.useRef(new Set<string>())

  const loadApprovals = React.useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const { apiClient } = await import("@/lib/apiClient")
      const res = await apiClient<{ success: boolean; requests: any[] }>("/api/work-requests?status=all")
      if (!res?.success || !Array.isArray(res.requests)) throw new Error("The approvals response was invalid.")
      const visibleStatuses = new Set(["pending", "approved", "rejected"])
      setApprovals(res.requests.filter((request: any) => visibleStatuses.has(request.status)).map((request: any) => ({
        id: String(request.id),
        title: request.title || `Work request: ${request.request_type || "Request"}`,
        category: "Work Request",
        requester: request.submitted_by_name || "Employee",
        requestedDate: request.created_at ? new Date(request.created_at).toLocaleDateString() : "—",
        amountOrQty: request.urgency ? String(request.urgency).toUpperCase() : undefined,
        status: request.status === "approved" ? "approved" : request.status === "rejected" ? "rejected" : "pending",
        details: request.reason || `Type: ${request.request_type || "work request"}`,
      })))
    } catch (error) {
      setLoadError("Could not load approval requests. Please retry.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void loadApprovals() }, [loadApprovals])

  const [activeTab, setActiveTab] = React.useState<string>("pending")

  const handleApprove = async (id: string) => {
    if (busyIdsRef.current.has(id)) return
    busyIdsRef.current.add(id)
    setBusyIds(new Set(busyIdsRef.current))
    try {
      const { apiClient } = await import("@/lib/apiClient")
      const result = await apiClient<{ success: boolean }>(`/api/work-requests/${encodeURIComponent(id)}/action`, {
        method: "PATCH",
        body: JSON.stringify({ action: "approve", owner_response: "Approved via Approval Center" }),
      })
      if (!result?.success) throw new Error("The request was not confirmed as approved.")
      setApprovals((prev) => prev.map((item) => item.id === id ? { ...item, status: "approved" } : item))
      const { toast } = await import("sonner")
      toast.success("Request approved.")
    } catch (error) {
      const { toast } = await import("sonner")
      toast.error(error instanceof Error ? error.message : "Could not approve request.")
    } finally {
      busyIdsRef.current.delete(id)
      setBusyIds(new Set(busyIdsRef.current))
    }
  }

  const handleReject = async (id: string) => {
    if (busyIdsRef.current.has(id)) return
    busyIdsRef.current.add(id)
    setBusyIds(new Set(busyIdsRef.current))
    try {
      const { apiClient } = await import("@/lib/apiClient")
      const result = await apiClient<{ success: boolean }>(`/api/work-requests/${encodeURIComponent(id)}/action`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject", owner_response: "Declined via Approval Center" }),
      })
      if (!result?.success) throw new Error("The request was not confirmed as rejected.")
      setApprovals((prev) => prev.map((item) => item.id === id ? { ...item, status: "rejected" } : item))
      const { toast } = await import("sonner")
      toast.success("Request rejected.")
    } catch (error) {
      const { toast } = await import("sonner")
      toast.error(error instanceof Error ? error.message : "Could not reject request.")
    } finally {
      busyIdsRef.current.delete(id)
      setBusyIds(new Set(busyIdsRef.current))
    }
  }

  const filteredData = approvals.filter((a) => a.status === activeTab)

  const columns: ColumnDef<ApprovalItem>[] = [
    {
      id: "title",
      header: "Approval Request",
      enableSorting: true,
      cell: (item) => (
        <div>
          <div className="font-semibold text-xs text-foreground">{item.title}</div>
          <div className="text-[11px] text-muted-foreground">{item.details}</div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      enableSorting: true,
      cell: (item) => (
        <Badge variant="outline" className="text-xs font-normal">
          {item.category}
        </Badge>
      ),
    },
    {
      id: "requester",
      header: "Requester",
      accessorKey: "requester",
      enableSorting: true,
      cell: (item) => <span className="text-xs font-medium">{item.requester}</span>,
    },
    {
      id: "requestedDate",
      header: "Date",
      accessorKey: "requestedDate",
      enableSorting: true,
      cell: (item) => <span className="text-xs text-muted-foreground">{item.requestedDate}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      cell: (item) => (
        <Badge
          variant={
            item.status === "approved"
              ? "success"
              : item.status === "rejected"
              ? "destructive"
              : "secondary"
          }
          className="text-xs capitalize"
        >
          {item.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      headerClassName: "text-right",
      cell: (item) => (
        <div className="flex items-center gap-1.5 justify-end">
          {item.status === "pending" ? (
            <>
            <Button
                size="sm"
                className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700"
                disabled={busyIds.has(item.id)}
                onClick={() => handleApprove(item.id)}
              >
                <Check className="h-3 w-3 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 text-rose-600 hover:bg-rose-50"
                disabled={busyIds.has(item.id)}
                onClick={() => handleReject(item.id)}
              >
                <X className="h-3 w-3 mr-1" /> Reject
              </Button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <Card className="border border-border/70 shadow-xs">
      <CardHeader className="p-4 border-b border-border/70 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Centralized Approval Center</CardTitle>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="pending" className="text-xs px-3">Pending ({approvals.filter(a => a.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs px-3">Approved</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs px-3">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loadError ? (
          <div role="alert" className="p-6 text-sm text-destructive">
            <p>{loadError}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void loadApprovals()}>Retry</Button>
          </div>
        ) : loading ? (
          <div role="status" className="p-6 text-sm text-muted-foreground">Loading approval requests…</div>
        ) : <EnterpriseDataTable<ApprovalItem>
          data={filteredData}
          columns={columns}
          getRowId={(a) => a.id}
          searchPlaceholder="Search approvals by title, requester..."
          storageKey="approval_center_table"
          emptyTitle="No approval requests"
          emptyDescription={`There are no ${activeTab} approval requests at this time.`}
          emptyIcon={ShieldCheck}
          enableRowSelection
          bulkActions={(selected) => (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={() => void Promise.all(selected.map((s) => handleApprove(s.id)))}
              >
                Approve Selected ({selected.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                onClick={() => void Promise.all(selected.map((s) => handleReject(s.id)))}
              >
                Reject Selected ({selected.length})
              </Button>
            </div>
          )}
        />}
      </CardContent>
    </Card>
  )
}
