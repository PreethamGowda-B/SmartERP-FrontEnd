// Data structures for the SmartERP system
export interface Job {
  id: string
  title: string
  client: string
  location: string
  status: "active" | "completed" | "pending" | "cancelled" | "open" | "in_progress" | "closed"
  startDate: string
  endDate: string
  budget: number
  spent: number
  assignedEmployees: string[]
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  // New employee tracking fields
  employee_status?: "pending" | "accepted" | "declined" | "assigned" | "arrived" | "completed"
  progress?: number
  accepted_at?: string
  declined_at?: string
  completed_at?: string
  created_at?: string
  createdAt?: string
  visible_to_all?: boolean
  employee_email?: string
  deadline?: string
  assigned_to?: string | null
  source?: string
  approval_status?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  hourlyRate: number
  status: "active" | "inactive"
  avatar?: string
  joinDate: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  clockIn: string
  clockOut?: string
  hoursWorked: number
  location: string
  jobId?: string
  status: "present" | "absent" | "late"
}

export interface MaterialRequest {
  id: string
  jobId: string
  requestedBy: string
  items: Array<{
    name: string
    quantity: number
    unit: string
    estimatedCost: number
  }>
  status: "pending" | "approved" | "rejected" | "ordered" | "delivered"
  requestDate: string
  urgency: "low" | "medium" | "high"
  notes?: string
  // Additional fields used by material-request-form
  materialName?: string
  description?: string
  quantity?: string | number
  imageUrl?: string
}

export interface PayrollRecord {
  id: string
  employeeId: string
  period: string
  regularHours: number
  overtimeHours: number
  totalPay: number
  deductions: number
  netPay: number
  status: "draft" | "processed" | "paid"
}

// Real operational datasets - initialized empty, dynamically populated from backend APIs
export const mockJobs: Job[] = []
export const mockEmployees: Employee[] = []
export const mockAttendance: AttendanceRecord[] = []
export const mockMaterialRequests: MaterialRequest[] = []
export const mockPayroll: PayrollRecord[] = []

