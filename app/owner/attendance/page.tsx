"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, Clock } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { useAuth } from "@/contexts/auth-context"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

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
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeAttendance[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
  })
  const [loading, setLoading] = useState(true)

  const getToken = () => {
    if (user?.accessToken) return user.accessToken
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken")
    }
    return null
  }

  const fetchAttendanceOverview = async () => {
    const token = getToken()
    if (!token) return

    setLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/api/attendance/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
        setSummary(data.summary || { total: 0, present: 0, absent: 0, late: 0 })
      }
    } catch (err) {
      console.error("Error fetching attendance overview:", err)
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
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Monitor employee attendance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{summary.present}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{summary.absent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{summary.late}</div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Attendance List */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : employees.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No employees found</p>
            ) : (
              <div className="space-y-2">
                {employees.map((employee) => (
                  <div
                    key={employee.user_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => {
                      // Navigate to employee detail page
                      window.location.href = `/owner/attendance/${employee.user_id}`
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {employee.employee_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{employee.employee_name}</p>
                        <p className="text-sm text-muted-foreground">{employee.employee_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Check In</p>
                        <p className="font-medium">{formatTime(employee.check_in_time)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Check Out</p>
                        <p className="font-medium">{formatTime(employee.check_out_time)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Hours</p>
                        <p className="font-medium">
                          {employee.working_hours ? `${employee.working_hours} hrs` : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(employee)}
                        {employee.is_late && (
                          <Badge variant="outline" className="text-orange-500 border-orange-500">
                            Late
                          </Badge>
                        )}
                      </div>
                    </div>
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
