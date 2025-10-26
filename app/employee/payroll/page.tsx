"use client"

import { EmployeeLayout } from "@/components/employee-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { calculatePayrollForEmployee, mockPayrollPeriods } from "@/lib/payroll-data"
import { useAuth } from "@/contexts/auth-context"
import { DollarSign, TrendingDown, TrendingUp, Download, Calendar } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

export default function EmployeePayrollPage() {
  const { user } = useAuth()

  // Get payroll records for the current employee
  const employeePayrollRecords = mockPayrollPeriods
    .map((period) => {
      const record = calculatePayrollForEmployee(user?.id || "", period.startDate, period.endDate)
      return record ? { ...record, period } : null
    })
    .filter((record) => record !== null)

  const currentRecord = employeePayrollRecords[0]
  const lastRecord = employeePayrollRecords[1]

  // Calculate year-to-date totals
  const ytdGrossPay = employeePayrollRecords.slice(0, 12).reduce((sum, record) => sum + (record?.grossPay || 0), 0)
  const ytdDeductions = employeePayrollRecords.slice(0, 12).reduce((sum, record) => sum + (record?.deductions || 0), 0)
  const ytdNetPay = employeePayrollRecords.slice(0, 12).reduce((sum, record) => sum + (record?.netPay || 0), 0)

  const handleDownloadPaystub = (recordId: string) => {
    alert(`Pay stub for ${recordId} would be downloaded`)
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-balance">My Payroll</h1>
          <p className="text-muted-foreground">View your pay history, deductions, and year-to-date earnings</p>
        </div>

        {/* Year-to-Date Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">YTD Gross Pay</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${ytdGrossPay.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Before deductions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">YTD Deductions</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">${ytdDeductions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Taxes & benefits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">YTD Net Pay</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${ytdNetPay.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Take-home pay</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Pay Period */}
        {currentRecord && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Pay Period</CardTitle>
                  <CardDescription>
                    {format(new Date(currentRecord.period.startDate), "MMM dd")} -{" "}
                    {format(new Date(currentRecord.period.endDate), "MMM dd, yyyy")}
                  </CardDescription>
                </div>
                <Badge variant={currentRecord.status === "paid" ? "default" : "outline"}>{currentRecord.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hours & Earnings */}
                <div className="space-y-3">
                  <h4 className="font-medium">Hours & Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Regular Hours</span>
                      <span>{currentRecord.regularHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overtime Hours</span>
                      <span>{currentRecord.overtimeHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hourly Rate</span>
                      <span>${currentRecord.hourlyRate}/hr</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Gross Pay</span>
                      <span>${currentRecord.grossPay.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <h4 className="font-medium">Deductions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Federal Tax</span>
                      <span className="text-destructive">-${(currentRecord.taxDeductions * 0.5).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">State Tax</span>
                      <span className="text-destructive">-${(currentRecord.taxDeductions * 0.2).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Social Security</span>
                      <span className="text-destructive">-${(currentRecord.taxDeductions * 0.2).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Medicare</span>
                      <span className="text-destructive">-${(currentRecord.taxDeductions * 0.1).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Benefits</span>
                      <span className="text-destructive">-${currentRecord.benefitDeductions.toFixed(0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Deductions</span>
                      <span className="text-destructive">-${currentRecord.deductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="space-y-3">
                  <h4 className="font-medium">Net Pay</h4>
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary">${currentRecord.netPay.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-1">Take-home pay</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => handleDownloadPaystub(currentRecord.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Pay Stub
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pay History */}
        <Card>
          <CardHeader>
            <CardTitle>Pay History</CardTitle>
            <CardDescription>Your recent payroll records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeePayrollRecords.slice(0, 6).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{format(new Date(record.period.startDate), "MMMM yyyy")} Payroll</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.period.startDate), "MMM dd")} -{" "}
                        {format(new Date(record.period.endDate), "MMM dd")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${record.netPay.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.status === "paid" ? "default" : "outline"} className="text-xs">
                        {record.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPaystub(record.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  )
}
