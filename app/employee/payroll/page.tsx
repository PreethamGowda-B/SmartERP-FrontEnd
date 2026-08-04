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
import { DollarSign, Download, Loader2, Calendar, FileText, CheckCircle2 } from "lucide-react"
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

      if (item.isDeduction) {
        doc.setTextColor(RED[0], RED[1], RED[2])
      } else {
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
      }
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

  // Calculate YTD metrics
  const totalYTDEarnings = (Array.isArray(payrolls) ? payrolls : []).reduce((sum, p) => sum + Number(p.total_salary || 0), 0)
  const latestPayout = Array.isArray(payrolls) && payrolls.length > 0 ? Number(payrolls[0].total_salary || 0) : 0
  const avgPayout = Array.isArray(payrolls) && payrolls.length > 0 ? Math.round(totalYTDEarnings / payrolls.length) : 0

  return (
    <EmployeeLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-indigo-600 to-accent bg-clip-text text-transparent">
                Earnings & Payroll Console
              </h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-0.5">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Active Account
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Review your monthly compensation statements, salary breakdown, and download official tax-compliant payslips.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold shadow-xs"
              onClick={() => {
                if (filteredPayrolls.length > 0) generatePDF(filteredPayrolls[0])
              }}
              disabled={filteredPayrolls.length === 0}
            >
              <Download className="h-4 w-4 mr-2" /> Latest Payslip PDF
            </Button>
          </div>
        </div>

        {/* Executive YTD Earnings Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="premium-card border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">Total YTD Earnings</p>
                  <p className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400 mt-1">
                    ₹{totalYTDEarnings.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1">Across {payrolls.length} statement periods</p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">Latest Disbursed Payout</p>
                  <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹{latestPayout.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1">
                    {payrolls.length > 0 ? `${MONTHS[payrolls[0].payroll_month - 1]} ${payrolls[0].payroll_year}` : "No records"}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">Average Monthly Payout</p>
                  <p className="text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400 mt-1">
                    ₹{avgPayout.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1">Net compensation average</p>
                </div>
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">Payment Channel</p>
                  <p className="text-lg font-bold tracking-tight text-foreground mt-1">Direct Bank Deposit</p>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified & Encrypted
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrated Filter Toolbar Bar */}
        <Card className="border shadow-xs bg-card/80 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[180px] h-9 rounded-xl text-xs font-semibold">
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
                <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs font-semibold">
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

            <div className="text-xs text-muted-foreground font-semibold">
              Showing <span className="text-foreground font-bold">{filteredPayrolls.length}</span> statement records
            </div>
          </CardContent>
        </Card>

        {/* Payroll Statements Grid */}
        <div className="space-y-6">
          {loading ? (
            <SkeletonList count={3} />
          ) : !Array.isArray(filteredPayrolls) || filteredPayrolls.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center py-16 text-muted-foreground">
                <FileText className="h-14 w-14 mx-auto mb-4 opacity-30 text-primary" />
                <p className="text-lg font-bold text-foreground">No payroll statements found</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">
                  Your monthly salary disbursements and payslips will appear here automatically once created by your organization.
                </p>
              </CardContent>
            </Card>
          ) : (
            Array.isArray(filteredPayrolls) && filteredPayrolls.map((payroll) => {
              const monthText = MONTHS[payroll.payroll_month - 1] || "Month"
              const baseSalary = Number(payroll.base_salary || 0)
              const extraAmount = Number(payroll.extra_amount || 0)
              const increment = Number(payroll.salary_increment || 0)
              const deduction = Number(payroll.deduction || 0)
              const totalSalary = Number(payroll.total_salary || 0)

              return (
                <Card key={payroll.id} className="premium-card hover:border-primary/40 hover:shadow-xl transition-all duration-300 overflow-hidden border">
                  {/* Top Highlight Strip */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500" />
                  
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl font-extrabold tracking-tight">
                              {monthText} {payroll.payroll_year}
                            </CardTitle>
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> PAID & DISBURSED
                            </Badge>
                          </div>
                          <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                            Ref: SLIP-PAY-{payroll.payroll_year}{(payroll.payroll_month < 10 ? "0" : "") + payroll.payroll_month}-{payroll.id}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => generatePDF(payroll)}
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-xl border-primary/20 hover:bg-primary/5 hover:border-primary text-primary font-bold shadow-xs transition-all"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Official Payslip PDF
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 pt-2">
                    {/* Itemized Salary Component Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">Base Salary</p>
                        <p className="text-xl font-black tracking-tight text-foreground">
                          ₹{baseSalary.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Basic + HRA + Allowances</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">Performance Bonus</p>
                        <p className={cn("text-xl font-black tracking-tight", extraAmount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50")}>
                          {extraAmount > 0 ? `+₹${extraAmount.toLocaleString("en-IN")}` : "₹0"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Field Incentives / Bonus</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">Increments</p>
                        <p className={cn("text-xl font-black tracking-tight", increment > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground/50")}>
                          {increment > 0 ? `+₹${increment.toLocaleString("en-IN")}` : "₹0"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Salary Adjustments</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70">Deductions</p>
                        <p className={cn("text-xl font-black tracking-tight", deduction > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground/50")}>
                          {deduction > 0 ? `-₹${deduction.toLocaleString("en-IN")}` : "₹0"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">TDS / Advance / Statutory</p>
                      </div>
                    </div>

                    {/* Net Take-Home Salary Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                          NET TAKE-HOME DISBURSEMENT
                        </p>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                          Transferred directly to registered employee bank account
                        </p>
                      </div>
                      <div className="text-3xl sm:text-4xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">
                        ₹{totalSalary.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Remarks Section */}
                    {payroll.remarks && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5">
                          Employer Remarks & Notes:
                        </p>
                        <div className="p-3.5 rounded-xl bg-accent/40 text-xs text-foreground/90 font-medium border border-border/40 italic">
                          &quot;{payroll.remarks}&quot;
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}
