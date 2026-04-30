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
import { apiClient, getAuthToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { cn } from "@/lib/utils"
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
        base_salary: Number(payroll.base_salary || 0),
        extra_amount: Number(payroll.extra_amount || 0),
        salary_increment: Number(payroll.salary_increment || 0),
        deduction: Number(payroll.deduction || 0),
        total_salary: Number(payroll.total_salary || 0)
      })) : []
      setPayrolls(parsedData)
    } catch (err: any) {
      logger.error("Error fetching payrolls:", err)
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
    doc.text(`₹ ${Number(payroll.base_salary || 0).toFixed(2)}`, 150, yPos, { align: "right" })
    yPos += 10

    // Extra Amount (if > 0)
    if (payroll.extra_amount > 0) {
      doc.text("Extra Amount:", 30, yPos)
      doc.text(`₹ ${Number(payroll.extra_amount || 0).toFixed(2)}`, 150, yPos, { align: "right" })
      yPos += 10
    }

    // Salary Increment (if > 0)
    if (payroll.salary_increment > 0) {
      doc.text("Salary Increment:", 30, yPos)
      doc.text(`₹ ${Number(payroll.salary_increment || 0).toFixed(2)}`, 150, yPos, { align: "right" })
      yPos += 10
    }

    // Deduction (if > 0)
    if (payroll.deduction > 0) {
      doc.text("Deduction:", 30, yPos)
      doc.text(`- ₹ ${Number(payroll.deduction || 0).toFixed(2)}`, 150, yPos, { align: "right" })
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
    doc.text(`₹ ${Number(payroll.total_salary || 0).toFixed(2)}`, 150, yPos, { align: "right" })

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
  const uniqueYears = Array.from(new Set((Array.isArray(payrolls) ? payrolls : []).map(p => p.payroll_year))).sort((a, b) => b - a)

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
            <SkeletonList count={3} />
          ) : !Array.isArray(filteredPayrolls) || filteredPayrolls.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payroll records found</p>
                <p className="text-sm mt-1">Your salary records will appear here once created by your employer</p>
              </CardContent>
            </Card>
          ) : (
            Array.isArray(filteredPayrolls) && filteredPayrolls.map((payroll) => (
              <Card key={payroll.id} className="premium-card hover-lift-subtle border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                        <Calendar className="h-5 w-5 text-primary" />
                        {MONTHS[payroll.payroll_month - 1]} {payroll.payroll_year}
                      </CardTitle>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                        Salary Disbursement
                      </p>
                    </div>
                    <Button
                      onClick={() => generatePDF(payroll)}
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-bold"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      PDF Report
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {/* Salary Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Base Salary</p>
                        <p className="text-xl font-black tracking-tighter text-foreground">₹{Number(payroll.base_salary || 0).toLocaleString('en-IN')}</p>
                      </div>

                      {Number(payroll.extra_amount || 0) > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Extra Amount</p>
                          <p className="text-xl font-black tracking-tighter text-green-600">
                            +₹{Number(payroll.extra_amount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}

                      {Number(payroll.salary_increment || 0) > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Increment</p>
                          <p className="text-xl font-black tracking-tighter text-green-600">
                            +₹{Number(payroll.salary_increment || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}

                      {Number(payroll.deduction || 0) > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Deduction</p>
                          <p className="text-xl font-black tracking-tighter text-red-600">
                            -₹{Number(payroll.deduction || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Total Salary */}
                    <div className="pt-4 border-t border-dashed">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Salary</span>
                        <span className="text-4xl font-black tracking-tighter text-primary">
                          ₹{Number(payroll.total_salary || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Remarks */}
                    {payroll.remarks && (
                      <div className="pt-3 border-t">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Remarks:</p>
                        <div className="bg-accent/30 p-3 rounded-lg text-sm italic text-muted-foreground leading-relaxed">
                          "{payroll.remarks}"
                        </div>
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
