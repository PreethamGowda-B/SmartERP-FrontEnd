"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DollarSign, Download, Loader2, Calendar, FileText } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { apiClient } from "@/lib/apiClient"
import jsPDF from "jspdf"

interface PayrollRecord {
  id: number
  employee_email: string
  employee_name: string
  payroll_month: number
  payroll_year: number
  base_salary: number
  extra_amount: number
  salary_increment: number
  deduction: number
  total_salary: number
  remarks: string | null
  created_at: string
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function EmployeePayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [monthFilter, setMonthFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")

  // Fetch employee's payroll records
  const fetchPayrolls = async () => {
    setLoading(true)
    try {
      const data = await apiClient("/api/payroll")
      // Convert string numbers to actual numbers for proper display
      const parsedData = Array.isArray(data) ? data.map((payroll: any) => ({
        ...payroll,
        base_salary: parseFloat(payroll.base_salary),
        extra_amount: parseFloat(payroll.extra_amount),
        salary_increment: parseFloat(payroll.salary_increment),
        deduction: parseFloat(payroll.deduction),
        total_salary: parseFloat(payroll.total_salary)
      })) : []
      setPayrolls(parsedData)
    } catch (err: any) {
      console.error("Error fetching payrolls:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayrolls()
  }, [])

  // Generate PDF salary report
  const generatePDF = (payroll: PayrollRecord) => {
    const doc = new jsPDF()

    // Company Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("SmartERP", 105, 20, { align: "center" })

    doc.setFontSize(16)
    doc.text("Salary Report", 105, 30, { align: "center" })

    // Payroll Period
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`${MONTHS[payroll.payroll_month - 1]} ${payroll.payroll_year}`, 105, 40, { align: "center" })

    // Horizontal line
    doc.setLineWidth(0.5)
    doc.line(20, 45, 190, 45)

    // Employee Details
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Employee Details:", 20, 55)

    doc.setFont("helvetica", "normal")
    doc.text(`Name: ${payroll.employee_name}`, 20, 65)
    doc.text(`Email: ${payroll.employee_email}`, 20, 72)

    // Salary Breakdown
    doc.setFont("helvetica", "bold")
    doc.text("Salary Breakdown:", 20, 85)

    let yPos = 95
    doc.setFont("helvetica", "normal")

    // Base Salary
    doc.text("Base Salary:", 30, yPos)
    doc.text(`₹ ${payroll.base_salary.toFixed(2)}`, 150, yPos, { align: "right" })
    yPos += 10

    // Extra Amount (if > 0)
    if (payroll.extra_amount > 0) {
      doc.text("Extra Amount:", 30, yPos)
      doc.text(`₹ ${payroll.extra_amount.toFixed(2)}`, 150, yPos, { align: "right" })
      yPos += 10
    }

    // Salary Increment (if > 0)
    if (payroll.salary_increment > 0) {
      doc.text("Salary Increment:", 30, yPos)
      doc.text(`₹ ${payroll.salary_increment.toFixed(2)}`, 150, yPos, { align: "right" })
      yPos += 10
    }

    // Deduction (if > 0)
    if (payroll.deduction > 0) {
      doc.text("Deduction:", 30, yPos)
      doc.text(`- ₹ ${payroll.deduction.toFixed(2)}`, 150, yPos, { align: "right" })
      yPos += 10
    }

    // Horizontal line before total
    doc.setLineWidth(0.3)
    doc.line(30, yPos + 2, 150, yPos + 2)
    yPos += 10

    // Total Salary
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text("TOTAL SALARY:", 30, yPos)
    doc.text(`₹ ${payroll.total_salary.toFixed(2)}`, 150, yPos, { align: "right" })

    // Remarks (if any)
    if (payroll.remarks) {
      yPos += 15
      doc.setFontSize(11)
      doc.text("Remarks:", 20, yPos)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)

      // Split remarks into multiple lines if needed
      const splitRemarks = doc.splitTextToSize(payroll.remarks, 170)
      doc.text(splitRemarks, 20, yPos + 7)
    }

    // Footer
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 280, { align: "center" })

    // Save PDF
    const fileName = `Salary_${payroll.employee_name.replace(/\s+/g, '_')}_${MONTHS[payroll.payroll_month - 1]}_${payroll.payroll_year}.pdf`
    doc.save(fileName)
  }

  // Filter payrolls
  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesMonth = monthFilter === "all" || payroll.payroll_month === parseInt(monthFilter)
    const matchesYear = yearFilter === "all" || payroll.payroll_year === parseInt(yearFilter)
    return matchesMonth && matchesYear
  })

  // Get unique years from payrolls
  const uniqueYears = Array.from(new Set(payrolls.map(p => p.payroll_year))).sort((a, b) => b - a)

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Payroll</h1>
          <p className="text-muted-foreground mt-1">View your salary records and download reports</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Records */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filteredPayrolls.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payroll records found</p>
                <p className="text-sm mt-1">Your salary records will appear here once created by your employer</p>
              </CardContent>
            </Card>
          ) : (
            filteredPayrolls.map((payroll) => (
              <Card key={payroll.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {MONTHS[payroll.payroll_month - 1]} {payroll.payroll_year}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Salary Report
                      </p>
                    </div>
                    <Button
                      onClick={() => generatePDF(payroll)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Salary Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Base Salary</p>
                        <p className="text-lg font-semibold">₹{payroll.base_salary.toFixed(2)}</p>
                      </div>

                      {payroll.extra_amount > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Extra Amount</p>
                          <p className="text-lg font-semibold text-green-600">
                            +₹{payroll.extra_amount.toFixed(2)}
                          </p>
                        </div>
                      )}

                      {payroll.salary_increment > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Salary Increment</p>
                          <p className="text-lg font-semibold text-green-600">
                            +₹{payroll.salary_increment.toFixed(2)}
                          </p>
                        </div>
                      )}

                      {payroll.deduction > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Deduction</p>
                          <p className="text-lg font-semibold text-red-600">
                            -₹{payroll.deduction.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Total Salary */}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Salary</span>
                        <span className="text-3xl font-bold text-primary">
                          ₹{payroll.total_salary.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Remarks */}
                    {payroll.remarks && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Remarks:</p>
                        <p className="text-sm">{payroll.remarks}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}
