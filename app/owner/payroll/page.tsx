"use client"

import { useState } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { PayrollPeriodCard } from "@/components/payroll-period-card"
import { PayrollDetails } from "@/components/payroll-details"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  mockPayrollPeriods,
  calculatePayrollForEmployee,
  getPayrollSummary,
  type PayrollPeriod,
  type DetailedPayrollRecord,
} from "@/lib/payroll-data"
import { mockEmployees } from "@/lib/data"
import { Plus, DollarSign, TrendingUp, Users, Clock } from "lucide-react"
import { format } from "date-fns"

export default function OwnerPayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>(mockPayrollPeriods)
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleViewPeriod = (period: PayrollPeriod) => {
    setSelectedPeriod(period)
    setIsDetailsOpen(true)
  }

  const handleProcessPeriod = (period: PayrollPeriod) => {
    setPeriods((prev) => prev.map((p) => (p.id === period.id ? { ...p, status: "processing" as const } : p)))
  }

  const handleCompletePeriod = (period: PayrollPeriod) => {
    setPeriods((prev) => prev.map((p) => (p.id === period.id ? { ...p, status: "completed" as const } : p)))
  }

  const handleDownloadPeriod = (period: PayrollPeriod) => {
    // Mock download functionality
    console.log(`Downloading payroll report for ${period.id}`)
    alert(`Payroll report for ${format(new Date(period.startDate), "MMMM yyyy")} would be downloaded`)
  }

  const handleCreateNewPeriod = () => {
    // Mock creating new payroll period
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const newPeriod: PayrollPeriod = {
      id: `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, "0")}-new`,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      status: "draft",
      totalEmployees: mockEmployees.length,
      totalGrossPay: 0,
      totalDeductions: 0,
      totalNetPay: 0,
    }

    setPeriods((prev) => [newPeriod, ...prev])
  }

  // Get detailed records for selected period
  const getDetailedRecords = (period: PayrollPeriod): DetailedPayrollRecord[] => {
    return mockEmployees
      .map((emp) => calculatePayrollForEmployee(emp.id, period.startDate, period.endDate))
      .filter((record): record is DetailedPayrollRecord => record !== null)
  }

  const selectedPeriodRecords = selectedPeriod ? getDetailedRecords(selectedPeriod) : []
  const selectedPeriodSummary = selectedPeriod ? getPayrollSummary(selectedPeriodRecords) : null

  // Calculate overview stats
  const currentMonthPeriod = periods.find((p) => p.status === "draft" || p.status === "processing")
  const lastCompletedPeriod = periods.find((p) => p.status === "completed" || p.status === "paid")
  const totalAnnualPayroll = periods.slice(0, 12).reduce((sum, period) => sum + period.totalNetPay, 0)

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Payroll Management</h1>
            <p className="text-muted-foreground">Manage employee payroll, deductions, and payments</p>
          </div>
          <Button onClick={handleCreateNewPeriod}>
            <Plus className="h-4 w-4 mr-2" />
            New Payroll Period
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockEmployees.length}</div>
              <p className="text-xs text-muted-foreground">On payroll</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Period</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentMonthPeriod?.totalNetPay.toLocaleString() || "0"}</div>
              <p className="text-xs text-muted-foreground">
                {currentMonthPeriod ? format(new Date(currentMonthPeriod.startDate), "MMMM yyyy") : "No active period"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Completed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${lastCompletedPeriod?.totalNetPay.toLocaleString() || "0"}</div>
              <p className="text-xs text-muted-foreground">
                {lastCompletedPeriod ? format(new Date(lastCompletedPeriod.startDate), "MMMM yyyy") : "None"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAnnualPayroll.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Periods */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Payroll Periods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periods.map((period) => (
              <PayrollPeriodCard
                key={period.id}
                period={period}
                onView={handleViewPeriod}
                onProcess={handleProcessPeriod}
                onComplete={handleCompletePeriod}
                onDownload={handleDownloadPeriod}
              />
            ))}
          </div>
        </div>

        {/* Payroll Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPeriod && `${format(new Date(selectedPeriod.startDate), "MMMM yyyy")} Payroll Details`}
              </DialogTitle>
            </DialogHeader>
            {selectedPeriod && selectedPeriodSummary && (
              <PayrollDetails
                records={selectedPeriodRecords}
                summary={selectedPeriodSummary}
                periodName={format(new Date(selectedPeriod.startDate), "MMMM yyyy")}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
