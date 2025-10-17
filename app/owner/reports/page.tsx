"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, DollarSign, Clock, Users, Download } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"

const reportData = {
  revenue: {
    current: 125000,
    previous: 98000,
    change: 27.6,
  },
  projects: {
    completed: 8,
    active: 12,
    pending: 5,
  },
  employees: {
    total: 24,
    active: 20,
    utilization: 83.3,
  },
  expenses: {
    materials: 45000,
    labor: 65000,
    equipment: 15000,
  },
}

const recentReports = [
  {
    id: 1,
    name: "Monthly Financial Summary",
    type: "Financial",
    date: "Dec 15, 2024",
    status: "completed",
  },
  {
    id: 2,
    name: "Project Progress Report",
    type: "Operations",
    date: "Dec 14, 2024",
    status: "completed",
  },
  {
    id: 3,
    name: "Employee Attendance Analysis",
    type: "HR",
    date: "Dec 13, 2024",
    status: "completed",
  },
  {
    id: 4,
    name: "Material Usage Report",
    type: "Inventory",
    date: "Dec 12, 2024",
    status: "processing",
  },
]

export default function ReportsPage() {
  const handleExportReport = () => {
    const exportData = {
      revenue: reportData.revenue,
      projects: reportData.projects,
      employees: reportData.employees,
      expenses: reportData.expenses,
      generatedAt: new Date().toISOString(),
    }

    // Create comprehensive report content
    const reportContent = `
BUSINESS REPORT - ${new Date().toLocaleDateString()}
=====================================

REVENUE SUMMARY
Current: $${exportData.revenue.current.toLocaleString()}
Previous: $${exportData.revenue.previous.toLocaleString()}
Change: +${exportData.revenue.change}%

PROJECT SUMMARY
Active Projects: ${exportData.projects.active}
Completed: ${exportData.projects.completed}
Pending: ${exportData.projects.pending}

EMPLOYEE SUMMARY
Total Employees: ${exportData.employees.total}
Active: ${exportData.employees.active}
Utilization: ${exportData.employees.utilization}%

EXPENSE BREAKDOWN
Materials: $${exportData.expenses.materials.toLocaleString()}
Labor: $${exportData.expenses.labor.toLocaleString()}
Equipment: $${exportData.expenses.equipment.toLocaleString()}
Total: $${(exportData.expenses.materials + exportData.expenses.labor + exportData.expenses.equipment).toLocaleString()}
    `.trim()

    // Download as text file
    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `business-report-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    console.log("[v0] Exported business report")
  }

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${reportData.revenue.current.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+{reportData.revenue.change}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{reportData.projects.active}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.projects.completed} completed this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Employee Utilization</p>
                <p className="text-2xl font-bold">{reportData.employees.utilization}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.employees.active} of {reportData.employees.total} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">
                  $
                  {(
                    reportData.expenses.materials +
                    reportData.expenses.labor +
                    reportData.expenses.equipment
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Revenue chart would be displayed here</p>
                <p className="text-sm">Integration with charting library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Materials</span>
                <span className="font-medium">${reportData.expenses.materials.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "36%" }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Labor</span>
                <span className="font-medium">${reportData.expenses.labor.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "52%" }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Equipment</span>
                <span className="font-medium">${reportData.expenses.equipment.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: "12%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.type} • {report.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === "completed" ? "default" : "secondary"}>{report.status}</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </OwnerLayout>
  )
}
