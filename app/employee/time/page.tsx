"use client"

import { EmployeeLayout } from "@/components/employee-layout"
import { TimeTracker } from "@/components/time-tracker"
import { AttendanceCalendar } from "@/components/attendance-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockAttendanceRecords, calculateAttendanceStats } from "@/lib/attendance-data"
import { useAuth } from "@/contexts/auth-context"
import { Clock, Calendar, TrendingUp, Award } from "lucide-react"

export default function EmployeeTimePage() {
  const { user } = useAuth()

  // Get employee's attendance records
  const employeeRecords = mockAttendanceRecords.filter((record) => record.employeeId === user?.id)
  const thisWeekRecords = employeeRecords.slice(0, 7)
  const thisMonthRecords = employeeRecords.slice(0, 30)

  const weekStats = calculateAttendanceStats(thisWeekRecords)
  const monthStats = calculateAttendanceStats(thisMonthRecords)

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-balance">Time Tracking</h1>
          <p className="text-muted-foreground">Track your work hours and view attendance history</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekStats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">
                {40 - weekStats.totalHours > 0 ? `${40 - weekStats.totalHours}h to reach 40h` : "Target reached!"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthStats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">{monthStats.daysPresent} days worked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((monthStats.daysPresent / (monthStats.daysPresent + monthStats.daysAbsent)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overtime</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthStats.overtimeHours}h</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Time Tracker and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimeTracker />

          <Card>
            <CardHeader>
              <CardTitle>Recent Time Entries</CardTitle>
              <CardDescription>Your latest work sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeeRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{record.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{record.hoursWorked}h</p>
                      <Badge
                        variant={
                          record.status === "present"
                            ? "default"
                            : record.status === "late"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Calendar */}
        <AttendanceCalendar records={employeeRecords} employeeId={user?.id} />
      </div>
    </EmployeeLayout>
  )
}
