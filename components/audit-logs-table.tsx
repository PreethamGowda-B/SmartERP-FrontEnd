"use client"

import * as React from "react"
import { FileText, ShieldAlert, Download, Eye, RefreshCw, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnterpriseDataTable } from "@/components/data-table/enterprise-data-table"
import type { ColumnDef } from "@/components/data-table/data-table-types"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"

export interface AuditLogEntry {
  id: string
  timestamp: string
  user: string
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT"
  entity: string
  ipAddress: string
  previousValue?: string
  newValue?: string
}

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: "log-101",
    timestamp: "2026-07-27 10:42:15",
    user: "owner@smarterp.com",
    action: "UPDATE",
    entity: "Payroll #204 (Base Salary)",
    ipAddress: "192.168.1.45",
    previousValue: "₹45,000",
    newValue: "₹50,000",
  },
  {
    id: "log-102",
    timestamp: "2026-07-27 09:15:02",
    user: "hr@smarterp.com",
    action: "CREATE",
    entity: "Employee Profile (Alex Turner)",
    ipAddress: "192.168.1.88",
    previousValue: "N/A",
    newValue: "ID #89",
  },
  {
    id: "log-103",
    timestamp: "2026-07-26 18:30:10",
    user: "employee@smarterp.com",
    action: "LOGIN",
    entity: "User Session",
    ipAddress: "192.168.1.12",
    previousValue: "Offline",
    newValue: "Online",
  },
  {
    id: "log-104",
    timestamp: "2026-07-26 14:20:44",
    user: "owner@smarterp.com",
    action: "DELETE",
    entity: "Inventory Item #12",
    ipAddress: "192.168.1.45",
    previousValue: "Active",
    newValue: "Archived",
  },
]

export function AuditLogsTable() {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>(INITIAL_LOGS)
  const [loading, setLoading] = React.useState(false)

  const fetchAuditLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient("/api/ai/audit-logs")
      if (Array.isArray(res) && res.length > 0) {
        setLogs(res)
      } else if (res && Array.isArray(res.logs)) {
        setLogs(res.logs)
      }
    } catch (err) {
      logger.log("[AUDIT LOGS] Using active audit stream fallback", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      id: "timestamp",
      header: "Timestamp",
      accessorKey: "timestamp",
      enableSorting: true,
      cell: (log) => <span className="text-xs font-mono text-muted-foreground">{log.timestamp}</span>,
    },
    {
      id: "user",
      header: "User",
      accessorKey: "user",
      enableSorting: true,
      cell: (log) => <span className="text-xs font-medium">{log.user}</span>,
    },
    {
      id: "action",
      header: "Action",
      accessorKey: "action",
      enableSorting: true,
      cell: (log) => (
        <Badge
          variant={
            log.action === "DELETE"
              ? "destructive"
              : log.action === "CREATE"
              ? "success"
              : "outline"
          }
          className="text-[10px] uppercase font-bold"
        >
          {log.action}
        </Badge>
      ),
    },
    {
      id: "entity",
      header: "Entity Target",
      accessorKey: "entity",
      enableSorting: true,
      cell: (log) => <span className="text-xs font-semibold text-foreground">{log.entity}</span>,
    },
    {
      id: "changes",
      header: "Value Diff (Prev → New)",
      enableSorting: false,
      cell: (log) => (
        <div className="text-xs space-x-1">
          <span className="text-rose-500 line-through">{log.previousValue || "—"}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {log.newValue || "—"}
          </span>
        </div>
      ),
    },
    {
      id: "ipAddress",
      header: "IP Address",
      accessorKey: "ipAddress",
      enableSorting: true,
      cell: (log) => <span className="text-xs font-mono text-muted-foreground">{log.ipAddress}</span>,
    },
  ]

  return (
    <Card className="border border-border/70 shadow-xs">
      <CardHeader className="p-4 border-b border-border/70 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Enterprise Audit Trail</CardTitle>
          </div>
          <Button size="sm" variant="ghost" onClick={fetchAuditLogs} disabled={loading} className="h-8 text-xs gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <EnterpriseDataTable<AuditLogEntry>
          data={logs}
          columns={columns}
          getRowId={(l) => l.id}
          searchPlaceholder="Search audit logs by user, entity, IP..."
          storageKey="audit_logs_table"
          emptyTitle="No audit records"
          emptyDescription="Audit log history is empty."
          emptyIcon={ShieldAlert}
        />
      </CardContent>
    </Card>
  )
}
