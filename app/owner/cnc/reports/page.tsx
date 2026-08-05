"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FileText, Download, FileSpreadsheet, Printer } from "lucide-react"

export default function ExecutiveReportsPage() {
  const REPORTS = [
    { title: "Daily Operations Summary", desc: "Breakdown dispatches, active jobs, on-site engineers, and SLA compliance", type: "PDF" },
    { title: "Weekly CNC Reliability & MTTR Report", desc: "MTTR, MTBF, PM compliance, and top alarm frequencies", type: "PDF / Excel" },
    { title: "Monthly Business & Revenue Summary", desc: "Service revenue, AMC profitability, spare part margins, and invoice status", type: "Excel" },
    { title: "Engineer Productivity & Ratings Report", desc: "Completed jobs count, average customer ratings, and response times", type: "PDF" },
    { title: "AMC Contracts & Expiry Schedule", desc: "Contract end dates, visit counters, and renewal probabilities", type: "Excel" },
  ]

  const handleExport = (reportTitle: string, format: string) => {
    toast.success(`Exported ${reportTitle} in ${format} format!`)
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-emerald-500" /> Executive Reports Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate and export Daily Operations, Weekly Performance, Monthly Financial, and AMC Reports in PDF & Excel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORTS.map((r, i) => (
          <Card key={i} className="p-6 border space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">{r.type}</Badge>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-2">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={() => handleExport(r.title, "PDF")} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 flex-1">
                <Download className="h-4 w-4" /> PDF Export
              </Button>
              <Button onClick={() => handleExport(r.title, "Excel")} size="sm" variant="outline" className="font-bold text-xs gap-1 flex-1">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel Export
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
