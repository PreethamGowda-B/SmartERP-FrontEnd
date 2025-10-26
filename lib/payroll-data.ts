// Payroll data and calculations
import { mockEmployees, type PayrollRecord } from "./data"
import { mockAttendanceRecords } from "./attendance-data"

export interface PayrollPeriod {
  id: string
  startDate: string
  endDate: string
  status: "draft" | "processing" | "completed" | "paid"
  totalEmployees: number
  totalGrossPay: number
  totalDeductions: number
  totalNetPay: number
}

export interface DetailedPayrollRecord extends PayrollRecord {
  employeeName: string
  employeePosition: string
  hourlyRate: number
  grossPay: number
  overtimePay: number
  bonuses: number
  taxDeductions: number
  benefitDeductions: number
  otherDeductions: number
}

export interface PayrollSummary {
  totalEmployees: number
  totalRegularHours: number
  totalOvertimeHours: number
  totalGrossPay: number
  totalDeductions: number
  totalNetPay: number
  averagePayPerEmployee: number
}

// Tax and deduction rates (configurable)
export const TAX_RATES = {
  federalTax: 0.12,
  stateTax: 0.05,
  socialSecurity: 0.062,
  medicare: 0.0145,
  unemployment: 0.006,
}

export const BENEFIT_RATES = {
  healthInsurance: 150,
  dental: 25,
  vision: 15,
  retirement401k: 0.03, // 3% of gross pay
}

export const calculatePayrollForEmployee = (
  employeeId: string,
  startDate: string,
  endDate: string,
): DetailedPayrollRecord | null => {
  const employee = mockEmployees.find((emp) => emp.id === employeeId)
  if (!employee) return null

  // Get attendance records for the period
  const attendanceRecords = mockAttendanceRecords.filter((record) => {
    const recordDate = new Date(record.date)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return record.employeeId === employeeId && recordDate >= start && recordDate <= end
  })

  const regularHours = attendanceRecords.reduce((sum, record) => sum + Math.min(record.hoursWorked, 8), 0)
  const overtimeHours = attendanceRecords.reduce((sum, record) => sum + Math.max(record.hoursWorked - 8, 0), 0)

  const regularPay = regularHours * employee.hourlyRate
  const overtimePay = overtimeHours * employee.hourlyRate * 1.5
  const bonuses = 0 // Could be calculated based on performance, etc.
  const grossPay = regularPay + overtimePay + bonuses

  // Calculate deductions
  const federalTax = grossPay * TAX_RATES.federalTax
  const stateTax = grossPay * TAX_RATES.stateTax
  const socialSecurity = grossPay * TAX_RATES.socialSecurity
  const medicare = grossPay * TAX_RATES.medicare
  const taxDeductions = federalTax + stateTax + socialSecurity + medicare

  const healthInsurance = BENEFIT_RATES.healthInsurance
  const dental = BENEFIT_RATES.dental
  const vision = BENEFIT_RATES.vision
  const retirement401k = grossPay * BENEFIT_RATES.retirement401k
  const benefitDeductions = healthInsurance + dental + vision + retirement401k

  const otherDeductions = 0 // Could include union dues, etc.
  const totalDeductions = taxDeductions + benefitDeductions + otherDeductions
  const netPay = grossPay - totalDeductions

  return {
    id: `${employeeId}-${startDate}`,
    employeeId,
    employeeName: employee.name,
    employeePosition: employee.position,
    hourlyRate: employee.hourlyRate,
    period: `${startDate} to ${endDate}`,
    regularHours,
    overtimeHours,
    grossPay,
    overtimePay,
    bonuses,
    taxDeductions,
    benefitDeductions,
    otherDeductions,
    totalPay: grossPay,
    deductions: totalDeductions,
    netPay,
    status: "draft",
  }
}

export const generatePayrollPeriods = (): PayrollPeriod[] => {
  const periods: PayrollPeriod[] = []
  const today = new Date()

  for (let i = 0; i < 6; i++) {
    const endDate = new Date(today.getFullYear(), today.getMonth() - i, 0) // Last day of month
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1) // First day of month

    const payrollRecords = mockEmployees.map((emp) =>
      calculatePayrollForEmployee(emp.id, startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]),
    )

    const validRecords = payrollRecords.filter((record): record is DetailedPayrollRecord => record !== null)

    const totalGrossPay = validRecords.reduce((sum, record) => sum + record.grossPay, 0)
    const totalDeductions = validRecords.reduce((sum, record) => sum + record.deductions, 0)
    const totalNetPay = validRecords.reduce((sum, record) => sum + record.netPay, 0)

    periods.push({
      id: `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, "0")}`,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      status: i === 0 ? "draft" : i === 1 ? "completed" : "paid",
      totalEmployees: validRecords.length,
      totalGrossPay,
      totalDeductions,
      totalNetPay,
    })
  }

  return periods.reverse()
}

export const mockPayrollPeriods = generatePayrollPeriods()

export const getPayrollSummary = (records: DetailedPayrollRecord[]): PayrollSummary => {
  const totalEmployees = records.length
  const totalRegularHours = records.reduce((sum, record) => sum + record.regularHours, 0)
  const totalOvertimeHours = records.reduce((sum, record) => sum + record.overtimeHours, 0)
  const totalGrossPay = records.reduce((sum, record) => sum + record.grossPay, 0)
  const totalDeductions = records.reduce((sum, record) => sum + record.deductions, 0)
  const totalNetPay = records.reduce((sum, record) => sum + record.netPay, 0)
  const averagePayPerEmployee = totalEmployees > 0 ? totalNetPay / totalEmployees : 0

  return {
    totalEmployees,
    totalRegularHours,
    totalOvertimeHours,
    totalGrossPay,
    totalDeductions,
    totalNetPay,
    averagePayPerEmployee,
  }
}
