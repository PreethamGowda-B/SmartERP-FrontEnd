"use client"

import * as React from "react"
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Package,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportToPDF } from "@/lib/export-utils"

export function ExecutiveAnalyticsDashboard() {
  const [period, setPeriod] = React.useState("month")

  const handleExportPDF = () => {
    exportToPDF({
      filename: `Executive_Analytics_${period}_${new Date().toISOString().split("T")[0]}`,
      title: "SmartERP Executive Analytics Report",
      subtitle: `Analytics Horizon: ${period.toUpperCase()} | Generated: ${new Date().toLocaleString()}`,
      columns: [
        { header: "KPI Metric", dataKey: "metric" },
        { header: "Current Value", dataKey: "value" },
        { header: "Trend Change", dataKey: "trend" },
      ],
      data: [
        { metric: "Headcount Productivity", value: "94.2%", trend: "+3.4%" },
        { metric: "Monthly Payroll Net", value: "₹4,85,000", trend: "Stable" },
        { metric: "Inventory Turn Rate", value: "8.4x", trend: "+1.2x" },
        { metric: "Job On-Time Completion", value: "91.8%", trend: "+5.1%" },
      ],
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Executive Analytics Console</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-functional KPI trends across Attendance, Payroll, Inventory, and Jobs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-9 gap-1.5 text-xs" onClick={handleExportPDF}>
            <Download className="h-3.5 w-3.5" /> Export Executive PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Productivity Rate</span>
              <Badge variant="success" className="text-[10px] gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> +3.4%
              </Badge>
            </div>
            <div className="text-2xl font-bold mt-2">94.2%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Attendance & job completion index</p>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Monthly Payroll</span>
              <Badge variant="outline" className="text-[10px]">
                Stable
              </Badge>
            </div>
            <div className="text-2xl font-bold mt-2">₹4,85,000</div>
            <p className="text-[11px] text-muted-foreground mt-1">Disbursed to 24 active staff</p>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Inventory Velocity</span>
              <Badge variant="success" className="text-[10px] gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> +1.2x
              </Badge>
            </div>
            <div className="text-2xl font-bold mt-2">8.4x</div>
            <p className="text-[11px] text-muted-foreground mt-1">Annual stock turn frequency</p>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">On-Time Jobs</span>
              <Badge variant="success" className="text-[10px] gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> +5.1%
              </Badge>
            </div>
            <div className="text-2xl font-bold mt-2">91.8%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Deliverables delivered on schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Bar Chart Visualizer */}
      <Card className="border border-border/70 shadow-xs">
        <CardHeader className="p-4 border-b border-border/70 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">Workforce Efficiency vs Payroll Distribution</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-border/70 pb-2">
            {[
              { label: "Mon", bar1: 85, bar2: 60 },
              { label: "Tue", bar1: 92, bar2: 75 },
              { label: "Wed", bar1: 98, bar2: 90 },
              { label: "Thu", bar1: 90, bar2: 82 },
              { label: "Fri", bar1: 95, bar2: 88 },
              { label: "Sat", bar1: 70, bar2: 50 },
              { label: "Sun", bar1: 40, bar2: 30 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="flex items-end gap-1.5 w-full justify-center h-full">
                  <div
                    className="w-3.5 bg-primary rounded-t-xs transition-all duration-500 hover:opacity-80"
                    style={{ height: `${d.bar1}%` }}
                    title={`Efficiency: ${d.bar1}%`}
                  />
                  <div
                    className="w-3.5 bg-emerald-500 rounded-t-xs transition-all duration-500 hover:opacity-80"
                    style={{ height: `${d.bar2}%` }}
                    title={`Payroll Ratio: ${d.bar2}%`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-xs bg-primary" />
              <span className="text-muted-foreground font-medium">Workforce Productivity Index</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span className="text-muted-foreground font-medium">Payroll Allocation Ratio</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
