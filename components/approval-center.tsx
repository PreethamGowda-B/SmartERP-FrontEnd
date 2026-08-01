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
  category: "Material Request" | "Leave Request" | "Payroll Approval" | "Job Approval"
  requester: string
  requestedDate: string
  amountOrQty?: string
  status: "pending" | "approved" | "rejected"
  details: string
}

export function ApprovalCenter() {
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>([
    {
      id: "app-1",
      title: "50x Safety Helmets Procurement",
      category: "Material Request",
      requester: "John Doe",
      requestedDate: "2026-07-26",
      amountOrQty: "50 units",
      status: "pending",
      details: "Required for new site expansion in Sector 4.",
    },
    {
      id: "app-2",
      title: "Annual Leave Request (3 Days)",
      category: "Leave Request",
      requester: "Sarah Smith",
      requestedDate: "2026-07-25",
      amountOrQty: "3 Days",
      status: "pending",
      details: "Personal leave request for August 5-7.",
    },
    {
      id: "app-3",
      title: "July Executive Payroll Disbursement",
      category: "Payroll Approval",
      requester: "HR Department",
      requestedDate: "2026-07-24",
      amountOrQty: "₹4,85,000",
      status: "pending",
      details: "Monthly payroll authorization for 24 staff members.",
    },
    {
      id: "app-4",
      title: "Structural Wiring Job Sign-off",
      category: "Job Approval",
      requester: "Mike Johnson",
      requestedDate: "2026-07-23",
      amountOrQty: "100% Complete",
      status: "approved",
      details: "Client accepted final deliverable.",
    },
  ])

  React.useEffect(() => {
    async function loadFieldActions() {
      try {
        const { apiClient } = await import("@/lib/apiClient")
        const fieldActions = await apiClient("/api/admin/approvals/field-actions")
        if (Array.isArray(fieldActions) && fieldActions.length > 0) {
          const mapped: ApprovalItem[] = fieldActions.map((fa: any) => ({
            id: fa.id,
            title: `Job Action: ${fa.action_type ? fa.action_type.replace(/_/g, ' ').toUpperCase() : 'FIELD REQUEST'} (${fa.job_title || 'Job'})`,
            category: "Job Approval",
            requester: fa.requester_name || "Field Employee",
            requestedDate: new Date(fa.created_at).toLocaleDateString(),
            amountOrQty: fa.urgency ? fa.urgency.toUpperCase() : "NORMAL",
            status: fa.status === 'pending_approval' ? 'pending' : (fa.status === 'approved' ? 'approved' : 'rejected'),
            details: fa.notes || `Module: ${fa.module}, Action: ${fa.action_type}`
          }))
          setApprovals((prev) => [...mapped, ...prev.filter(p => !p.id.includes('-'))])
        }
      } catch (err) {
        // Fallback silently if unauthenticated or offline
      }
    }
    loadFieldActions()
  }, [])

  const [activeTab, setActiveTab] = React.useState<string>("pending")

  const handleApprove = async (id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a))
    )
    if (!id.startsWith("app-")) {
      try {
        const { apiClient } = await import("@/lib/apiClient")
        await apiClient(`/api/jobs/actions/${id}/respond`, {
          method: "PATCH",
          body: JSON.stringify({ decision: "approved", owner_response: "Approved via Approval Center" })
        })
        const { toast } = await import("sonner")
        toast.success("Field Action Approved!")
      } catch (e) {}
    }
  }

  const handleReject = async (id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a))
    )
    if (!id.startsWith("app-")) {
      try {
        const { apiClient } = await import("@/lib/apiClient")
        await apiClient(`/api/jobs/actions/${id}/respond`, {
          method: "PATCH",
          body: JSON.stringify({ decision: "rejected", owner_response: "Declined via Approval Center" })
        })
        const { toast } = await import("sonner")
        toast.error("Field Action Rejected")
      } catch (e) {}
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
                onClick={() => handleApprove(item.id)}
              >
                <Check className="h-3 w-3 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 text-rose-600 hover:bg-rose-50"
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
        <EnterpriseDataTable<ApprovalItem>
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
                onClick={() => selected.forEach((s) => handleApprove(s.id))}
              >
                Approve Selected ({selected.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                onClick={() => selected.forEach((s) => handleReject(s.id))}
              >
                Reject Selected ({selected.length})
              </Button>
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
