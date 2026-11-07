"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { apiClient } from "@/lib/apiClient"
import { exportToPDF, exportToExcel, ExportColumn } from "@/lib/export-utils"
import {
  FileText,
  Download,
  FileSpreadsheet,
  Cpu,
  Wrench,
  Users,
  Box,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react"

type ReportDef = {
  id: string
  title: string
  desc: string
  category: string
  icon: any
  fetchData: () => Promise<{ data: any[]; columns: ExportColumn[] }>
}

export default function ExecutiveReportsPage() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const REPORTS: ReportDef[] = [
    {
      id: "operations",
      title: "Daily Field Service Operations Summary",
      desc: "Live field jobs, customer breakdown dispatches, assigned field technicians, and job statuses",
      category: "Operations",
      icon: Wrench,
      fetchData: async () => {
        const res = await apiClient<any>("/api/jobs")
        const jobs = res?.jobs || (Array.isArray(res) ? res : [])
        const columns: ExportColumn[] = [
          { header: "Job Title", dataKey: "title" },
          { header: "Customer", dataKey: "customer_name" },
          { header: "Technician", dataKey: "employee_name" },
          { header: "Priority", dataKey: "priority" },
          { header: "Status", dataKey: "status" },
          { header: "Created Date", dataKey: "created_at" },
        ]
        const data = jobs.map((j: any) => ({
          title: j.title || j.name || "Service Job",
          customer_name: j.customer_name || j.customer?.name || "Customer",
          employee_name: j.employee_name || j.assigned_employee_name || "Unassigned",
          priority: (j.priority || "Normal").toUpperCase(),
          status: (j.status || "Open").replace(/_/g, " ").toUpperCase(),
          created_at: j.created_at ? new Date(j.created_at).toLocaleDateString("en-IN") : "—",
        }))
        return { data, columns }
      },
    },
    {
      id: "machines",
      title: "CNC Fleet Telemetry & Machine Registry",
      desc: "Registered CNC machines, controller models, spindle operating hours, and operational status",
      category: "Telemetry",
      icon: Cpu,
      fetchData: async () => {
        const res = await apiClient<any>("/api/machines")
        const machines = res?.machines || (Array.isArray(res) ? res : [])
        const columns: ExportColumn[] = [
          { header: "Machine Name", dataKey: "machine_name" },
          { header: "Customer / Facility", dataKey: "customer_name" },
          { header: "Make", dataKey: "make" },
          { header: "Model", dataKey: "model" },
          { header: "Serial Number", dataKey: "serial_number" },
          { header: "Controller", dataKey: "controller_type" },
          { header: "Spindle Hours", dataKey: "spindle_hours" },
          { header: "Health Score", dataKey: "health_score" },
          { header: "Status", dataKey: "status" },
        ]
        const data = machines.map((m: any) => ({
          machine_name: m.machine_name || "CNC Machine",
          customer_name: m.customer_name || "In-House Workshop",
          make: m.make || "Standard",
          model: m.model || "—",
          serial_number: m.serial_number || "—",
          controller_type: m.controller_type || "Standard CNC",
          spindle_hours: m.spindle_hours || 0,
          health_score: `${m.health_score || 100}%`,
          status: (m.status || "Operational").toUpperCase(),
        }))
        return { data, columns }
      },
    },
    {
      id: "employees",
      title: "Field Engineers & Technical Crew Directory",
      desc: "Complete staff roster, designated positions, verified contact info, and active crew status",
      category: "Personnel",
      icon: Users,
      fetchData: async () => {
        const res = await apiClient<any>("/api/employees")
        const employees = Array.isArray(res) ? res : (res?.employees || [])
        const columns: ExportColumn[] = [
          { header: "Employee Name", dataKey: "name" },
          { header: "Email Address", dataKey: "email" },
          { header: "Phone Number", dataKey: "phone" },
          { header: "Designation / Role", dataKey: "position" },
          { header: "Department", dataKey: "department" },
          { header: "Status", dataKey: "status" },
        ]
        const data = employees.map((e: any) => ({
          name: e.name || "Employee",
          email: e.email || "—",
          phone: e.phone || "—",
          position: e.position || e.role || "Technician",
          department: e.department || "Field Engineering",
          status: (e.status || (e.is_active !== false ? "Active" : "Inactive")).toUpperCase(),
        }))
        return { data, columns }
      },
    },
    {
      id: "inventory",
      title: "CNC Spares & Materials Stock Valuation",
      desc: "Live spare parts inventory, current stock counts, SKUs, reorder thresholds, and unit valuation",
      category: "Materials",
      icon: Box,
      fetchData: async () => {
        const res = await apiClient<any>("/api/inventory").catch(() => ({ items: [] }))
        const items = res?.items || (Array.isArray(res) ? res : [])
        const columns: ExportColumn[] = [
          { header: "Part / Item Name", dataKey: "name" },
          { header: "SKU / Code", dataKey: "sku" },
          { header: "Category", dataKey: "category" },
          { header: "In Stock", dataKey: "quantity" },
          { header: "Unit", dataKey: "unit" },
          { header: "Unit Cost (₹)", dataKey: "cost" },
        ]
        const data = items.map((item: any) => ({
          name: item.name || "Spare Part",
          sku: item.sku || "—",
          category: item.category || "General",
          quantity: item.quantity ?? item.current_stock ?? 0,
          unit: item.unit || "pcs",
          cost: Number(item.unit_cost || item.cost_price || 0).toFixed(2),
        }))
        return { data, columns }
      },
    },
    {
      id: "warranty",
      title: "Supplier Warranty Lifecycle & Defect Claims",
      desc: "Defective component returns, vendor warranty submissions, failure rationales, and credit amounts",
      category: "Warranty",
      icon: ShieldCheck,
      fetchData: async () => {
        const res = await apiClient<any>("/api/warranty-claims").catch(() => ({ claims: [] }))
        const claims = res?.claims || (Array.isArray(res) ? res : [])
        const columns: ExportColumn[] = [
          { header: "Claim Number", dataKey: "claim_number" },
          { header: "Spare Part", dataKey: "spare_part_name" },
          { header: "Supplier / Vendor", dataKey: "supplier_name" },
          { header: "Serial Number", dataKey: "serial_number" },
          { header: "Failure Reason", dataKey: "failure_reason" },
          { header: "Claim Status", dataKey: "status" },
          { header: "Filed Date", dataKey: "created_at" },
        ]
        const data = claims.map((c: any) => ({
          claim_number: c.claim_number || "—",
          spare_part_name: c.spare_part_name || c.part_name || "Component",
          supplier_name: c.supplier_name || c.vendor_name || "Supplier",
          serial_number: c.serial_number || "—",
          failure_reason: c.failure_reason || "Component failure",
          status: (c.status || "Submitted").replace(/_/g, " ").toUpperCase(),
          created_at: c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "—",
        }))
        return { data, columns }
      },
    },
  ]

  const handleExport = async (report: ReportDef, format: "pdf" | "excel") => {
    const loadingKey = `${report.id}-${format}`
    setDownloadingId(loadingKey)
    try {
      if (!report.fetchData) {
        throw new Error("This report has no connected data/export endpoint yet.")
      }
      toast.loading(`Compiling ${report.title}...`, { id: "export-toast" })
      const { data, columns } = await report.fetchData()

      const filename = `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}`

      if (format === "pdf") {
        exportToPDF({
          title: report.title,
          subtitle: `SmartERP Business Operations — Generated on ${new Date().toLocaleString("en-IN")}`,
          filename,
          columns,
          data,
        })
      } else {
        exportToExcel({
          title: report.title,
          filename,
          columns,
          data,
        })
      }

      toast.success(`${report.title} exported successfully!`, { id: "export-toast" })
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report export", { id: "export-toast" })
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-emerald-600" /> Executive Reports Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Download business intelligence, fleet telemetry, crew attendance, operations summaries, and parts valuation in professional PDF and Excel formats
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORTS.map((r) => {
          const Icon = r.icon
          const isPdfBusy = downloadingId === `${r.id}-pdf`
          const isExcelBusy = downloadingId === `${r.id}-excel`

          return (
            <Card key={r.id} className="p-6 border shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {r.category}
                  </Badge>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">{r.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
              </div>

              <div className="flex gap-2 pt-5 border-t mt-4">
                <Button
                  onClick={() => handleExport(r, "pdf")}
                  disabled={Boolean(downloadingId)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 flex-1 shadow-2xs"
                >
                  {isPdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  PDF
                </Button>
                <Button
                  onClick={() => handleExport(r, "excel")}
                  disabled={Boolean(downloadingId)}
                  size="sm"
                  variant="outline"
                  className="font-bold text-xs gap-1.5 flex-1 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {isExcelBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                  Excel
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
