"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // ✅ Import useRouter
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, Clock } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { useAuth } from "@/contexts/auth-context"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

import { apiClient, getAuthToken } from "@/lib/apiClient"
import { ExportButton } from "@/components/export-button"
import { logger } from "@/lib/logger"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { EnterpriseDataTable } from "@/components/data-table/enterprise-data-table"

function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

interface EmployeeAttendance {
  user_id: string
  employee_name: string
  employee_email: string
  attendance_id: number | null
  date: string
  check_in_time: string | null
  check_out_time: string | null
  working_hours: number | null
  status: string | null
  is_late: boolean
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
}

export default function OwnerAttendancePage() {
  const router = useRouter() // ✅ Add router hook
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeAttendance[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchAttendanceOverview = async () => {
    setLoading(true)
    try {
      const data = await apiClient("/api/attendance/overview")
      setEmployees(Array.isArray(data.employees) ? data.employees : [])
      setSummary(data.summary || { total: 0, present: 0, absent: 0, late: 0 })
    } catch (err: any) {
      logger.error("Error fetching attendance overview:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAttendanceOverview()
    }
  }, [user])

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (employee: EmployeeAttendance) => {
    if (!employee.check_in_time) {
      return <Badge variant="destructive">Absent</Badge>
    }

    if (!employee.check_out_time) {
      return <Badge className="bg-blue-500">Checked In</Badge>
    }

    switch (employee.status) {
      case "present":
        return <Badge className="bg-green-500">Present</Badge>
      case "half_day":
        return <Badge className="bg-yellow-500">Half Day</Badge>
      case "absent":
        return <Badge variant="destructive">Absent</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground">Monitor employee attendance</p>
          </div>
          <ExportButton
            filename={`Attendance_Report_${new Date().toISOString().split('T')[0]}`}
            title="Employee Attendance Report"
            subtitle={`Monthly Attendance & Performance Analysis`}
            onExport={async () => {
              const now = new Date()
              const month = now.getMonth() + 1
              const year = now.getFullYear()
              const data = await apiClient(`/api/attendance/report?month=${month}&year=${year}`)

              // Flatten the grouped data from backend for the export table
              const flatData: any[] = []
              if (data && data.employees) {
                data.employees.forEach((emp: any) => {
                  if (emp.records && emp.records.length > 0) {
                    emp.records.forEach((rec: any) => {
                      flatData.push({
                        employee_name: emp.employee.name,
                        employee_email: emp.employee.email,
                        date: rec.date,
                        check_in: rec.check_in,
                        check_out: rec.check_out,
                        status: rec.status,
                        working_hours: rec.hours
                      })
                    })
                  } else {
                    // Include employee even if no records for the month (as absent/no data)
                    flatData.push({
                      employee_name: emp.employee.name,
                      employee_email: emp.employee.email,
                      date: "—",
                      check_in: "—",
                      check_out: "—",
                      status: "No Data",
                      working_hours: 0
                    })
                  }
                })
              }
              return flatData
            }}
            columns={[
              { header: "Employee", dataKey: "employee_name" },
              { header: "Email", dataKey: "employee_email" },
              { header: "Date", dataKey: "date", type: "date" },
              { header: "Check In", dataKey: "check_in", type: "date" },
              { header: "Check Out", dataKey: "check_out", type: "date" },
              { header: "Status", dataKey: "status" },
              { header: "Hours", dataKey: "working_hours", type: "number" }
            ]}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="premium-card hover-lift-subtle border border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight">{Number(summary.total || 0)}</div>
            </CardContent>
          </Card>

          <Card className="premium-card hover-lift-subtle border border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Present</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-green-600">{Number(summary.present || 0)}</div>
            </CardContent>
          </Card>

          <Card className="premium-card hover-lift-subtle border border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Absent</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-red-600">{Number(summary.absent || 0)}</div>
            </CardContent>
          </Card>

          <Card className="premium-card hover-lift-subtle border border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Late Arrivals</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-orange-600">{Number(summary.late || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Attendance Table */}
        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-0">
            <EnterpriseDataTable<EmployeeAttendance>
              data={employees}
              columns={[
                {
                  id: "employee",
                  header: "Employee",
                  enableSorting: true,
                  cell: (emp) => (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        {(emp.employee_name || "E").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{emp.employee_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{emp.employee_email}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "check_in",
                  header: "Check In",
                  accessorKey: "check_in_time",
                  enableSorting: true,
                  cell: (emp) => (
                    <span className="font-medium text-xs text-foreground">
                      {formatTime(emp.check_in_time)}
                    </span>
                  ),
                },
                {
                  id: "check_out",
                  header: "Check Out",
                  accessorKey: "check_out_time",
                  enableSorting: true,
                  cell: (emp) => (
                    <span className="font-medium text-xs text-foreground">
                      {formatTime(emp.check_out_time)}
                    </span>
                  ),
                },
                {
                  id: "working_hours",
                  header: "Hours",
                  accessorKey: "working_hours",
                  enableSorting: true,
                  cell: (emp) =>
                    emp.working_hours ? `${Number(emp.working_hours || 0).toFixed(1)}h` : "—",
                },
                {
                  id: "status",
                  header: "Status",
                  accessorKey: "status",
                  enableSorting: true,
                  cell: (emp) => (
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(emp)}
                      {emp.is_late && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold text-amber-600 border-amber-300 dark:border-amber-800"
                        >
                          Late
                        </Badge>
                      )}
                    </div>
                  ),
                },
              ]}
              getRowId={(emp) => String(emp.user_id)}
              searchPlaceholder="Search attendance by employee name or email..."
              isLoading={loading}
              storageKey="owner_attendance_table"
              emptyTitle="No attendance records found"
              emptyDescription="There are no attendance records logged for today yet."
              emptyIcon={Users}
              onRowClick={(emp) => router.push(`/owner/attendance/${emp.user_id}`)}
            />
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
