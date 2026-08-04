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
import { getCompanyBranding } from "@/lib/export-utils"

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

  // Generate Executive PDF salary report
  const generatePDF = (payroll: PayrollRecord) => {
    const doc = new jsPDF()
    const pageW = doc.internal.pageSize.getWidth()
    const company = getCompanyBranding()
    const companyName = company.name || "SmartERP Enterprise"

    // Colors
    const NAVY = [15, 40, 80] as const
    const ACCENT_BLUE = [37, 99, 235] as const
    const BG_LIGHT = [248, 250, 252] as const
    const TEXT_DARK = [30, 41, 59] as const
    const TEXT_MUTED = [100, 116, 139] as const
    const GREEN = [22, 163, 74] as const
    const RED = [220, 38, 38] as const
    const BORDER = [226, 232, 240] as const

    const formatINR = (val: number): string => {
      try {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }).format(val)
      } catch {
        return `₹ ${val.toFixed(2)}`
      }
    }

    // ── Header Banner ──────────────────────────────────────────────────────
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, pageW, 36, "F")

    // Blue Accent Bar
    doc.setFillColor(...ACCENT_BLUE)
    doc.rect(0, 0, pageW, 4, "F")

    // Company Name
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.text(companyName.toUpperCase(), 14, 17)

    // Document Subtitle
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(203, 213, 225)
    doc.text("SALARY PAYSLIP & EARNINGS STATEMENT", 14, 26)

    // Period Pill Badge
    const monthName = MONTHS[payroll.payroll_month - 1] || "Month"
    const periodText = `${monthName.toUpperCase()} ${payroll.payroll_year}`
    doc.setFillColor(30, 58, 110)
    doc.roundedRect(pageW - 65, 10, 51, 18, 3, 3, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text("PAY PERIOD", pageW - 40, 16, { align: "center" })
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text(periodText, pageW - 40, 23.5, { align: "center" })

    // ── Employee & Payslip Metadata Card ──────────────────────────────────
    let y = 44
    doc.setFillColor(...BG_LIGHT)
    doc.setDrawColor(...BORDER)
    doc.roundedRect(14, y, pageW - 28, 38, 3, 3, "FD")

    // Col 1: Employee Details
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MUTED)
    doc.text("EMPLOYEE DETAILS", 20, y + 8)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(...TEXT_DARK)
    doc.text(payroll.employee_name || "Employee", 20, y + 16)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MUTED)
    doc.text(payroll.employee_email || "N/A", 20, y + 23)

    // Col 2: Payslip Metadata
    const col2X = pageW / 2 + 10
    const payslipNo = `SLIP-PAY-${payroll.payroll_year}${(payroll.payroll_month < 10 ? "0" : "") + payroll.payroll_month}-${payroll.id || Math.floor(1000 + Math.random() * 9000)}`

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MUTED)
    doc.text("STATEMENT DETAILS", col2X, y + 8)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_DARK)
    doc.text(`Payslip Ref: `, col2X, y + 16)
    doc.setFont("helvetica", "bold")
    doc.text(payslipNo, col2X + 22, y + 16)

    doc.setFont("helvetica", "normal")
    doc.text(`Status: `, col2X, y + 23)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...GREEN)
    doc.text("PAID & DISBURSED", col2X + 13, y + 23)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MUTED)
    doc.text(`Issued Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, col2X, y + 30)

    // ── Table Header: Earnings Breakdown ──────────────────────────────────
    y += 46
    doc.setFillColor(...NAVY)
    doc.rect(14, y, pageW - 28, 10, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text("EARNINGS & DEDUCTIONS BREAKDOWN", 20, y + 6.5)
    doc.text("AMOUNT (INR)", pageW - 20, y + 6.5, { align: "right" })

    y += 10

    // Item rows
    const items: { label: string; amount: number; isDeduction?: boolean }[] = [
      { label: "Base Salary (Basic + HRA + Allowances)", amount: Number(payroll.base_salary || 0) },
    ]

    if (payroll.extra_amount > 0) {
      items.push({ label: "Performance Bonus / Field Incentive", amount: Number(payroll.extra_amount || 0) })
    }
    if (payroll.salary_increment > 0) {
      items.push({ label: "Salary Increment Adjustments", amount: Number(payroll.salary_increment || 0) })
    }
    if (payroll.deduction > 0) {
      items.push({ label: "Deductions (TDS / Advance / Statutory)", amount: Number(payroll.deduction || 0), isDeduction: true })
    }

    let isZebra = false
    items.forEach((item) => {
      if (isZebra) {
        doc.setFillColor(248, 250, 252)
        doc.rect(14, y, pageW - 28, 10, "F")
      }
      doc.setDrawColor(...BORDER)
      doc.line(14, y + 10, pageW - 14, y + 10)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9.5)
      doc.setTextColor(...(item.isDeduction ? RED : TEXT_DARK))
      doc.text(item.label, 20, y + 6.5)

      doc.setFont("helvetica", "bold")
      doc.text(
        item.isDeduction ? `- ${formatINR(item.amount)}` : formatINR(item.amount),
        pageW - 20,
        y + 6.5,
        { align: "right" }
      )

      y += 10
      isZebra = !isZebra
    })

    // ── Net Take-Home Salary Summary Banner ──────────────────────────────
    y += 4
    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(187, 247, 208)
    doc.roundedRect(14, y, pageW - 28, 16, 3, 3, "FD")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(22, 101, 52)
    doc.text("NET TAKE-HOME SALARY", 20, y + 10.5)

    doc.setFontSize(13)
    doc.setTextColor(22, 163, 74)
    doc.text(formatINR(Number(payroll.total_salary || 0)), pageW - 20, y + 10.5, { align: "right" })

    // ── Remarks Section ────────────────────────────────────────────────────
    y += 24
    if (payroll.remarks) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8.5)
      doc.setTextColor(...TEXT_MUTED)
      doc.text("PAYROLL REMARKS & NOTES", 14, y)
      y += 5

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(...TEXT_DARK)
      const lines = doc.splitTextToSize(payroll.remarks, pageW - 28)
      doc.text(lines, 14, y)
      y += lines.length * 5 + 8
    } else {
      y += 4
    }

    // ── Sign-off & Stamp Section ──────────────────────────────────────────
    y = Math.max(y, 195)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.4)
    doc.line(14, y, pageW - 14, y)
    y += 12

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT_DARK)
    doc.text("AUTHORIZED SIGNATORY", pageW - 20, y, { align: "right" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MUTED)
    doc.text(companyName, pageW - 20, y + 5, { align: "right" })
    doc.text("Digitally Signed & Validated", pageW - 20, y + 9.5, { align: "right" })

    doc.setFontSize(7.5)
    doc.text("Confidential — For Employee Private Use Only", 14, y)
    doc.text("System Generated Payslip. No signature required.", 14, y + 4.5)

    // ── Footer ─────────────────────────────────────────────────────────────
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(148, 163, 184)
    doc.text(`SmartERP® Enterprise Solutions • Generated on ${new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}`, pageW / 2, 285, { align: "center" })

    // Save PDF
    const fileName = `Payslip_${payroll.employee_name.replace(/\s+/g, '_')}_${monthName}_${payroll.payroll_year}.pdf`
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
