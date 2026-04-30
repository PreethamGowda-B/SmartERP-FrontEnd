"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Plus, Loader2, Search, Calendar, FileText } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"
import { ExportButton } from "@/components/export-button"
import { logger } from "@/lib/logger"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList } from "@/components/ui/skeleton-card"

interface Employee {
  id: string
  name: string
  email: string
}

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

export default function OwnerPayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  // Removed: employees state (now using direct email input)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [monthFilter, setMonthFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")

  // Get current month and year
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const [formData, setFormData] = useState({
    employee_email: "",
    payroll_month: currentMonth,
    payroll_year: currentYear,
    base_salary: "",
    extra_amount: "",
    salary_increment: "",
    deduction: "",
    remarks: ""
  })

  // Calculate total salary
  const calculateTotal = () => {
    const base = parseFloat(formData.base_salary) || 0
    const extra = parseFloat(formData.extra_amount) || 0
    const increment = parseFloat(formData.salary_increment) || 0
    const deduction = parseFloat(formData.deduction) || 0
    return base + extra + increment - deduction
  }

  // Removed: fetchEmployees function (now using direct email input)

  // Fetch payroll records
  const fetchPayrolls = async () => {
    setLoading(true)
    try {
      setError(null)
      const data = await apiClient("/api/payroll")
      // Convert string numbers to actual numbers for proper display
      const parsedData = Array.isArray(data) ? data.map((payroll: any) => ({
        ...payroll,
        base_salary: parseFloat(payroll.base_salary) || 0,
        extra_amount: parseFloat(payroll.extra_amount) || 0,
        salary_increment: parseFloat(payroll.salary_increment) || 0,
        deduction: parseFloat(payroll.deduction) || 0,
        total_salary: parseFloat(payroll.total_salary) || 0
      })) : []
      setPayrolls(parsedData)
    } catch (err: any) {
      setError({
        title: "Could not load payrolls",
        message: err.message || "Failed to fetch payroll records from server."
      })
      logger.error("Error fetching payrolls:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayrolls()
  }, [])

  // Submit new payroll
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await apiClient("/api/payroll", {
        method: "POST",
        body: JSON.stringify({
          employee_email: formData.employee_email,
          payroll_month: formData.payroll_month,
          payroll_year: formData.payroll_year,
          base_salary: parseFloat(formData.base_salary),
          extra_amount: parseFloat(formData.extra_amount) || 0,
          salary_increment: parseFloat(formData.salary_increment) || 0,
          deduction: parseFloat(formData.deduction) || 0,
          remarks: formData.remarks || null
        })
      })

      // Reset form
      setFormData({
        employee_email: "",
        payroll_month: currentMonth,
        payroll_year: currentYear,
        base_salary: "",
        extra_amount: "",
        salary_increment: "",
        deduction: "",
        remarks: ""
      })

      // Refresh payrolls
      await fetchPayrolls()

      // Close dialog
      setDialogOpen(false)

      alert("Payroll created successfully!")
    } catch (err: any) {
      alert(err.message || "Failed to create payroll")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter payrolls
  const filteredPayrolls = payrolls.filter(payroll => {
    const empName = payroll.employee_name || ""
    const empEmail = payroll.employee_email || ""
    
    const matchesSearch =
      empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesMonth = monthFilter === "all" || payroll.payroll_month === parseInt(monthFilter)
    const matchesYear = yearFilter === "all" || payroll.payroll_year === parseInt(yearFilter)

    return matchesSearch && matchesMonth && matchesYear
  })

  // Get unique years from payrolls
  const uniqueYears = Array.from(new Set(payrolls.map(p => p.payroll_year))).sort((a, b) => b - a)

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Payroll <span className="text-primary">Console</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              Manage financial disbursements, track employee compensation, and maintain historical payroll records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExportButton
              filename="Payroll_Report"
              title="Employee Payroll Summary"
              subtitle={`Company-wide Financial Disbursement Report`}
              onExport={async () => {
                const data = await apiClient("/api/payroll/all")
                return Array.isArray(data) ? data.map((p: any) => ({
                  ...p,
                  month_name: MONTHS[(p.payroll_month - 1) % 12] || "Unknown",
                  period: `${MONTHS[(p.payroll_month - 1) % 12] || ""} ${p.payroll_year}`,
                  base_salary: parseFloat(p.base_salary) || 0,
                  extra_amount: parseFloat(p.extra_amount) || 0,
                  salary_increment: parseFloat(p.salary_increment) || 0,
                  deduction: parseFloat(p.deduction) || 0,
                  total_salary: parseFloat(p.total_salary) || 0
                })) : []
              }}
              columns={[
                { header: "Employee Name", dataKey: "employee_name" },
                { header: "Email", dataKey: "employee_email" },
                { header: "Period", dataKey: "period" },
                { header: "Base Salary", dataKey: "base_salary", type: "currency" },
                { header: "Extra", dataKey: "extra_amount", type: "currency" },
                { header: "Increment", dataKey: "salary_increment", type: "currency" },
                { header: "Deduction", dataKey: "deduction", type: "currency" },
                { header: "Total Salary", dataKey: "total_salary", type: "currency" }
              ]}
            />
            {/* Create Payroll Button */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-10 px-6 shadow-lg shadow-primary/20 btn-premium">
                  <Plus className="h-4 w-4 mr-2" />
                  New Disbursement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary p-8 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight text-white">Create Disbursement</DialogTitle>
                    <DialogDescription className="text-primary-foreground/80 font-medium">
                      Authorize a new salary payment for your staff member.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-background">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="employee_email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Staff Member Email</Label>
                      <Input
                        id="employee_email"
                        type="email"
                        value={formData.employee_email}
                        onChange={(e) => setFormData({ ...formData, employee_email: e.target.value })}
                        placeholder="e.g. technician@smarterp.com"
                        className="h-11"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="payroll_month" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Month</Label>
                        <Select
                          value={formData.payroll_month.toString()}
                          onValueChange={(value) => setFormData({ ...formData, payroll_month: parseInt(value) })}
                          required
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((month, index) => (
                              <SelectItem key={index + 1} value={(index + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="payroll_year" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Year</Label>
                        <Input
                          id="payroll_year"
                          type="number"
                          value={formData.payroll_year}
                          onChange={(e) => setFormData({ ...formData, payroll_year: parseInt(e.target.value) })}
                          className="h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="base_salary" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Base Salary (INR)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                        <Input
                          id="base_salary"
                          type="number"
                          step="0.01"
                          value={formData.base_salary}
                          onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                          className="h-12 pl-8 text-lg font-black tracking-tight"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="extra_amount" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Extra</Label>
                        <Input
                          id="extra_amount"
                          type="number"
                          step="0.01"
                          value={formData.extra_amount}
                          onChange={(e) => setFormData({ ...formData, extra_amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="salary_increment" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Increment</Label>
                        <Input
                          id="salary_increment"
                          type="number"
                          step="0.01"
                          value={formData.salary_increment}
                          onChange={(e) => setFormData({ ...formData, salary_increment: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="deduction" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-red-500">Deduction</Label>
                        <Input
                          id="deduction"
                          type="number"
                          step="0.01"
                          value={formData.deduction}
                          onChange={(e) => setFormData({ ...formData, deduction: e.target.value })}
                          placeholder="0.00"
                          className="border-red-200 focus-visible:ring-red-500"
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-border/60">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Net Disbursement</span>
                        <span className="text-3xl font-black text-primary tracking-tighter">
                          ₹{Number(calculateTotal() || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="remarks" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Internal Notes</Label>
                      <Textarea
                        id="remarks"
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        placeholder="Add disbursement context..."
                        className="resize-none"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-md font-bold shadow-xl shadow-primary/20 btn-premium" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Authorize Disbursement"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
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
              <SelectTrigger className="w-full sm:w-[150px] h-10">
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
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Historical Records <span className="text-sm font-bold text-muted-foreground/60 ml-2">({filteredPayrolls.length})</span>
            </h2>
            <div className="text-meta">Audit-ready documentation</div>
          </div>

          {loading && payrolls.length === 0 ? (
            <SkeletonList count={4} />
          ) : error && payrolls.length === 0 ? (
            <ErrorView title={error.title} message={error.message} onRetry={fetchPayrolls} />
          ) : filteredPayrolls.length === 0 ? (
            <EmptyState 
              icon={FileText}
              title="No payroll records found"
              description="Your financial disbursement history is empty. Start by creating a new payroll record for your staff."
              actionLabel="New Disbursement"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredPayrolls.map((payroll) => (
                <Card
                  key={payroll.id}
                  className="premium-card hover-lift group border-none shadow-sm overflow-hidden"
                >
                  <div className="h-1.5 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row justify-between gap-8">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-xl">
                            {payroll.employee_name?.[0] || "E"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{payroll.employee_name}</h3>
                              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0">
                                {MONTHS[(payroll.payroll_month - 1) % 12]} {payroll.payroll_year}
                              </Badge>
                            </div>
                            <p className="text-meta">{payroll.employee_email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Base Salary</p>
                            <p className="text-sm font-black tracking-tight">₹{Number(payroll.base_salary || 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-green-600/60">Increments</p>
                            <p className="text-sm font-black tracking-tight text-green-600">+₹{Number((payroll.extra_amount || 0) + (payroll.salary_increment || 0)).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-600/60">Deductions</p>
                            <p className="text-sm font-black tracking-tight text-red-600">-₹{Number(payroll.deduction || 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Generated</p>
                            <p className="text-sm font-semibold text-muted-foreground">{new Date(payroll.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-64 flex flex-col justify-center items-end border-t lg:border-t-0 lg:border-l border-border/40 pt-6 lg:pt-0 lg:pl-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Net Disbursement</p>
                        <div className="text-4xl font-black tracking-tighter text-primary">₹{Number(payroll.total_salary || 0).toLocaleString('en-IN')}</div>
                        <Button variant="ghost" size="sm" className="mt-4 h-8 text-xs font-bold gap-2 hover:bg-primary/5 hover:text-primary">
                          <FileText className="h-3.5 w-3.5" />
                          Download Slip
                        </Button>
                      </div>
                    </div>

                    {payroll.remarks && (
                      <div className="mt-6 p-4 rounded-2xl bg-secondary/30 text-xs font-medium text-muted-foreground leading-relaxed">
                        <span className="font-black uppercase tracking-widest text-[9px] mr-2 text-muted-foreground/50">Notes:</span> 
                        {payroll.remarks}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  )
}
