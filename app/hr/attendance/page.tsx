"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, Clock } from "lucide-react"
import { HRLayout } from "@/components/hr-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import { ExportButton } from "@/components/export-button"
import { logger } from "@/lib/logger"

import { EnterpriseDataTable } from "@/components/data-table/enterprise-data-table"

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

export default function HRAttendancePage() {
  const router = useRouter()
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
      setEmployees(data.employees || [])
      setSummary(data.summary || { total: 0, present: 0, absent: 0, late: 0 })
    } catch (err) {
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
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (employee: EmployeeAttendance) => {
    if (!employee.check_in_time) return <Badge variant="destructive">Absent</Badge>
    if (!employee.check_out_time) return <Badge className="bg-blue-500">In</Badge>
    return <Badge className="bg-green-500">Present</Badge>
  }

  return (
    <HRLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attendance Monitoring</h1>
            <p className="text-muted-foreground">Monitor real-time employee attendance status.</p>
          </div>
          <ExportButton
            filename={`Attendance_HR_${new Date().toISOString().split('T')[0]}`}
            title="HR Attendance Report"
            onExport={async () => {
              const res = await apiClient(`/api/attendance/overview`)
              return res.employees || []
            }}
            columns={[
              { header: "Name", dataKey: "employee_name" },
              { header: "Email", dataKey: "employee_email" },
              { header: "Check In", dataKey: "check_in_time" },
              { header: "Check Out", dataKey: "check_out_time" },
              { header: "Status", dataKey: "status" }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
             <CardContent className="pt-4">
               <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total</p>
               <h3 className="text-2xl font-bold">{summary.total}</h3>
             </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
             <CardContent className="pt-4">
               <p className="text-xs text-green-500 uppercase font-bold tracking-wider">Present</p>
               <h3 className="text-2xl font-bold text-green-500">{summary.present}</h3>
             </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
             <CardContent className="pt-4">
               <p className="text-xs text-red-500 uppercase font-bold tracking-wider">Absent</p>
               <h3 className="text-2xl font-bold text-red-500">{summary.absent}</h3>
             </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
             <CardContent className="pt-4">
               <p className="text-xs text-orange-500 uppercase font-bold tracking-wider">Late</p>
               <h3 className="text-2xl font-bold text-orange-500">{summary.late}</h3>
             </CardContent>
          </Card>
        </div>

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
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        {emp.employee_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-xs text-foreground">{emp.employee_name}</p>
                        <p className="text-[11px] text-muted-foreground">{emp.employee_email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "check_in",
                  header: "Check In",
                  accessorKey: "check_in_time",
                  enableSorting: true,
                  cell: (emp) => <span className="text-xs">{formatTime(emp.check_in_time)}</span>,
                },
                {
                  id: "check_out",
                  header: "Check Out",
                  accessorKey: "check_out_time",
                  enableSorting: true,
                  cell: (emp) => <span className="text-xs">{formatTime(emp.check_out_time)}</span>,
                },
                {
                  id: "status",
                  header: "Status",
                  accessorKey: "status",
                  enableSorting: true,
                  cell: (emp) => getStatusBadge(emp),
                },
              ]}
              getRowId={(emp) => String(emp.user_id)}
              searchPlaceholder="Search attendance roster..."
              isLoading={loading}
              storageKey="hr_attendance_table"
              emptyTitle="No attendance records"
              emptyDescription="No employee attendance records found for today."
              emptyIcon={Users}
            />
          </CardContent>
        </Card>
      </div>
    </HRLayout>
  )
}
