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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Plus, Loader2, Search, Calendar } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"

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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
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

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const data = await apiClient("/api/payroll/employees")
      setEmployees(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Error fetching employees:", err)
    }
  }

  // Fetch payroll records
  const fetchPayrolls = async () => {
    setLoading(true)
    try {
      const data = await apiClient("/api/payroll")
      setPayrolls(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Error fetching payrolls:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
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
    const matchesSearch =
      payroll.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employee_email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesMonth = monthFilter === "all" || payroll.payroll_month === parseInt(monthFilter)
    const matchesYear = yearFilter === "all" || payroll.payroll_year === parseInt(yearFilter)

    return matchesSearch && matchesMonth && matchesYear
  })

  // Get unique years from payrolls
  const uniqueYears = Array.from(new Set(payrolls.map(p => p.payroll_year))).sort((a, b) => b - a)

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payroll Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage employee payroll records</p>
          </div>

          {/* Create Payroll Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Payroll</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Employee Selection */}
                <div className="space-y-2">
                  <Label htmlFor="employee_email">Employee *</Label>
                  <Select
                    value={formData.employee_email}
                    onValueChange={(value) => setFormData({ ...formData, employee_email: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.email}>
                          {emp.name} ({emp.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payroll_month">Month *</Label>
                    <Select
                      value={formData.payroll_month.toString()}
                      onValueChange={(value) => setFormData({ ...formData, payroll_month: parseInt(value) })}
                      required
                    >
                      <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label htmlFor="payroll_year">Year *</Label>
                    <Input
                      id="payroll_year"
                      type="number"
                      value={formData.payroll_year}
                      onChange={(e) => setFormData({ ...formData, payroll_year: parseInt(e.target.value) })}
                      min="2020"
                      max="2100"
                      required
                    />
                  </div>
                </div>

                {/* Base Salary */}
                <div className="space-y-2">
                  <Label htmlFor="base_salary">Base Salary *</Label>
                  <Input
                    id="base_salary"
                    type="number"
                    step="0.01"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                    placeholder="Enter base salary"
                    required
                  />
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="extra_amount">Extra Amount</Label>
                    <Input
                      id="extra_amount"
                      type="number"
                      step="0.01"
                      value={formData.extra_amount}
                      onChange={(e) => setFormData({ ...formData, extra_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary_increment">Salary Increment</Label>
                    <Input
                      id="salary_increment"
                      type="number"
                      step="0.01"
                      value={formData.salary_increment}
                      onChange={(e) => setFormData({ ...formData, salary_increment: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deduction">Deduction</Label>
                    <Input
                      id="deduction"
                      type="number"
                      step="0.01"
                      value={formData.deduction}
                      onChange={(e) => setFormData({ ...formData, deduction: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Total Salary Display */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Salary:</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Payroll...
                    </>
                  ) : (
                    "Create Payroll"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by employee name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payroll Records ({filteredPayrolls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payroll records found</p>
                <p className="text-sm mt-1">Create your first payroll record to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayrolls.map((payroll) => (
                  <div
                    key={payroll.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{payroll.employee_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {MONTHS[payroll.payroll_month - 1]} {payroll.payroll_year}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{payroll.employee_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{payroll.total_salary.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Total Salary</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Base Salary</p>
                        <p className="font-medium">₹{payroll.base_salary.toFixed(2)}</p>
                      </div>
                      {payroll.extra_amount > 0 && (
                        <div>
                          <p className="text-muted-foreground">Extra Amount</p>
                          <p className="font-medium text-green-600">+₹{payroll.extra_amount.toFixed(2)}</p>
                        </div>
                      )}
                      {payroll.salary_increment > 0 && (
                        <div>
                          <p className="text-muted-foreground">Increment</p>
                          <p className="font-medium text-green-600">+₹{payroll.salary_increment.toFixed(2)}</p>
                        </div>
                      )}
                      {payroll.deduction > 0 && (
                        <div>
                          <p className="text-muted-foreground">Deduction</p>
                          <p className="font-medium text-red-600">-₹{payroll.deduction.toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    {payroll.remarks && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Remarks:</span> {payroll.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
