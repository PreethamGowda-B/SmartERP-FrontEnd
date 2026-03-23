"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, Clock } from "lucide-react"
import { HRLayout } from "@/components/hr-layout"
import { useAuth } from "@/contexts/auth-context"
import { getAccessToken, apiClient } from "@/lib/apiClient"
import { ExportButton } from "@/components/export-button"
import { logger } from "@/lib/logger"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
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
      const response = await fetch(`${BACKEND_URL}/api/attendance/overview`, {
        credentials: "include",
        headers: authHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
        setSummary(data.summary || { total: 0, present: 0, absent: 0, late: 0 })
      }
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

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Daily Roster</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div key={employee.user_id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                         {employee.employee_name.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <p className="font-medium text-sm">{employee.employee_name}</p>
                         <p className="text-xs text-muted-foreground">{employee.employee_email}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-center">
                         <p className="text-[10px] text-muted-foreground uppercase font-bold">In</p>
                         <p className="text-sm">{formatTime(employee.check_in_time)}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[10px] text-muted-foreground uppercase font-bold">Out</p>
                         <p className="text-sm">{formatTime(employee.check_out_time)}</p>
                       </div>
                       {getStatusBadge(employee)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </HRLayout>
  )
}
