"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { DetailedPayrollRecord, PayrollSummary } from "@/lib/payroll-data"
import { DollarSign, Clock, TrendingUp, Users } from "lucide-react"

interface PayrollDetailsProps {
  records: DetailedPayrollRecord[]
  summary: PayrollSummary
  periodName: string
}

export function PayrollDetails({ records, summary, periodName }: PayrollDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRegularHours + summary.totalOvertimeHours}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalRegularHours}h regular, {summary.totalOvertimeHours}h overtime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalGrossPay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Before deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalNetPay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">After deductions</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Details */}
      <Card>
        <CardHeader>
          <CardTitle>{periodName} - Employee Payroll Details</CardTitle>
          <CardDescription>Individual employee payroll breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{record.employeeName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{record.employeeName}</h4>
                      <p className="text-sm text-muted-foreground">{record.employeePosition}</p>
                      <p className="text-xs text-muted-foreground">${record.hourlyRate}/hour</p>
                    </div>
                  </div>
                  <Badge variant={record.status === "paid" ? "default" : "outline"}>{record.status}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Hours & Earnings */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Hours & Earnings</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Regular Hours</span>
                        <span>{record.regularHours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overtime Hours</span>
                        <span>{record.overtimeHours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Regular Pay</span>
                        <span>${(record.regularHours * record.hourlyRate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overtime Pay</span>
                        <span>${record.overtimePay.toLocaleString()}</span>
                      </div>
                      {record.bonuses > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bonuses</span>
                          <span>${record.bonuses.toLocaleString()}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Gross Pay</span>
                        <span>${record.grossPay.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Deductions</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax Deductions</span>
                        <span className="text-destructive">-${record.taxDeductions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Benefits</span>
                        <span className="text-destructive">-${record.benefitDeductions.toLocaleString()}</span>
                      </div>
                      {record.otherDeductions > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Other</span>
                          <span className="text-destructive">-${record.otherDeductions.toLocaleString()}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Total Deductions</span>
                        <span className="text-destructive">-${record.deductions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Net Pay</h5>
                    <div className="bg-primary/10 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">${record.netPay.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Take-home pay</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
