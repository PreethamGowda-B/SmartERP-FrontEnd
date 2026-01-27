// Data structures for the SmartERP system
export interface Job {
  id: string
  title: string
  client: string
  location: string
  status: "active" | "completed" | "pending" | "cancelled"
  startDate: string
  endDate: string
  budget: number
  spent: number
  assignedEmployees: string[]
  description: string
  priority: "low" | "medium" | "high"
  // New employee tracking fields
  employee_status?: "pending" | "accepted" | "declined"
  progress?: number
  accepted_at?: string
  declined_at?: string
  completed_at?: string
  created_at?: string
  createdAt?: string
  visible_to_all?: boolean
  employee_email?: string
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
  // Legacy/Simple form fields
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

// Sample data for development and testing
export const mockJobs: Job[] = [
  {
    id: "1",
    title: "Downtown Office Complex",
    client: "ABC Corporation",
    location: "123 Main St, Downtown",
    status: "active",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    budget: 250000,
    spent: 125000,
    assignedEmployees: ["2", "3", "4"],
    description: "Construction of a 5-story office complex with modern amenities",
    priority: "high",
  },
  {
    id: "2",
    title: "Residential Housing Project",
    client: "Green Valley Homes",
    location: "456 Oak Ave, Suburbs",
    status: "active",
    startDate: "2024-02-01",
    endDate: "2024-08-15",
    budget: 180000,
    spent: 45000,
    assignedEmployees: ["2", "5"],
    description: "Building 12 single-family homes in new development",
    priority: "medium",
  },
  {
    id: "3",
    title: "Bridge Renovation",
    client: "City Public Works",
    location: "River Bridge, City Center",
    status: "completed",
    startDate: "2023-09-01",
    endDate: "2023-12-15",
    budget: 95000,
    spent: 92000,
    assignedEmployees: ["3", "4"],
    description: "Complete renovation of historic city bridge",
    priority: "high",
  },
]

export const mockEmployees: Employee[] = [
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@smarterp.com",
    phone: "+1 (555) 987-6543",
    position: "Site Supervisor",
    department: "Construction",
    hourlyRate: 35,
    status: "active",
    joinDate: "2023-03-15",
  },
  {
    id: "3",
    name: "Mike Rodriguez",
    email: "mike@smarterp.com",
    phone: "+1 (555) 456-7890",
    position: "Foreman",
    department: "Construction",
    hourlyRate: 32,
    status: "active",
    joinDate: "2022-08-20",
  },
  {
    id: "4",
    name: "Emily Chen",
    email: "emily@smarterp.com",
    phone: "+1 (555) 234-5678",
    position: "Project Manager",
    department: "Management",
    hourlyRate: 45,
    status: "active",
    joinDate: "2023-01-10",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david@smarterp.com",
    phone: "+1 (555) 345-6789",
    position: "Equipment Operator",
    department: "Operations",
    hourlyRate: 28,
    status: "active",
    joinDate: "2023-06-01",
  },
]

export const mockAttendance: AttendanceRecord[] = [
  {
    id: "1",
    employeeId: "2",
    date: "2024-01-15",
    clockIn: "07:30",
    clockOut: "16:30",
    hoursWorked: 8,
    location: "Downtown Office Complex",
    jobId: "1",
    status: "present",
  },
  {
    id: "2",
    employeeId: "3",
    date: "2024-01-15",
    clockIn: "08:00",
    clockOut: "17:00",
    hoursWorked: 8,
    location: "Downtown Office Complex",
    jobId: "1",
    status: "present",
  },
]

export const mockMaterialRequests: MaterialRequest[] = [
  {
    id: "1",
    jobId: "1",
    requestedBy: "Sarah Johnson",
    items: [
      { name: "Steel Beams", quantity: 20, unit: "pieces", estimatedCost: 15000 },
      { name: "Concrete Mix", quantity: 50, unit: "bags", estimatedCost: 2500 },
    ],
    status: "pending",
    requestDate: "2024-01-14",
    urgency: "high",
    notes: "Needed for foundation work by end of week",
  },
]

export const mockPayroll: PayrollRecord[] = [
  {
    id: "1",
    employeeId: "2",
    period: "2024-01",
    regularHours: 160,
    overtimeHours: 12,
    totalPay: 6020,
    deductions: 1200,
    netPay: 4820,
    status: "processed",
  },
]
