"use client"

import { useState } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { AttendanceCalendar } from "@/components/attendance-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockEmployees } from "@/lib/data"
import { mockAttendanceRecords, calculateAttendanceStats } from "@/lib/attendance-data"
import { Clock, Users, TrendingUp, AlertTriangle, Download } from "lucide-react"
import { format } from "date-fns"

export default function OwnerAttendancePage() {
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("30")

  const filteredRecords =
    selectedEmployee === "all"
      ? mockAttendanceRecords
      : mockAttendanceRecords.filter((record) => record.employeeId === selectedEmployee)

  const periodRecords = filteredRecords.slice(0, Number.parseInt(selectedPeriod))
  const stats = calculateAttendanceStats(periodRecords)

  // Calculate team-wide stats
  const teamStats = mockEmployees.map((employee) => {
    const employeeRecords = mockAttendanceRecords.filter((record) => record.employeeId === employee.id).slice(0, 30)
    const employeeStats = calculateAttendanceStats(employeeRecords)
    return {
      employee,
      ...employeeStats,
    }
  })

  const selectedEmployeeData = mockEmployees.find((emp) => emp.id === selectedEmployee)

  const handleExportReport = () => {
    const reportData = {
      period: `Last ${selectedPeriod} days`,
      employee: selectedEmployee === "all" ? "All Employees" : selectedEmployeeData?.name,
      stats,
      records: periodRecords,
      generatedAt: new Date().toISOString(),
    }

    // Create CSV content
    const csvContent = [
      ["Date", "Employee", "Clock In", "Clock Out", "Hours", "Status"],
      ...periodRecords.map((record) => {
        const employee = mockEmployees.find((emp) => emp.id === record.employeeId)
        return [
          record.date,
          employee?.name || "Unknown",
          record.clockIn || "—",
          record.clockOut || "—",
          record.hoursWorked,
          record.status,
        ]
      }),
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    console.log("[v0] Exported attendance report:", reportData)
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Attendance Management</h1>
            <p className="text-muted-foreground">Monitor and manage employee attendance and time tracking</p>
          </div>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {mockEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">
                {stats.regularHours}h regular, {stats.overtimeHours}h overtime
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats.daysPresent / (stats.daysPresent + stats.daysAbsent)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.daysPresent} present, {stats.daysAbsent} absent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Hours/Day</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageHoursPerDay}h</div>
              <p className="text-xs text-muted-foreground">Per working day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {periodRecords.filter((record) => record.status === "late").length}
              </div>
              <p className="text-xs text-muted-foreground">This period</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Overview */}
        {selectedEmployee === "all" && (
          <Card>
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
              <CardDescription>Individual employee attendance summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamStats.map(({ employee, totalHours, daysPresent, daysAbsent }) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{totalHours}h</p>
                        <p className="text-muted-foreground">Total Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{Math.round((daysPresent / (daysPresent + daysAbsent)) * 100)}%</p>
                        <p className="text-muted-foreground">Attendance</p>
                      </div>
                      <Badge
                        variant={
                          daysPresent / (daysPresent + daysAbsent) >= 0.95
                            ? "default"
                            : daysPresent / (daysPresent + daysAbsent) >= 0.85
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {daysPresent / (daysPresent + daysAbsent) >= 0.95
                          ? "Excellent"
                          : daysPresent / (daysPresent + daysAbsent) >= 0.85
                            ? "Good"
                            : "Needs Attention"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Calendar */}
        <AttendanceCalendar
          records={filteredRecords}
          employeeId={selectedEmployee === "all" ? undefined : selectedEmployee}
        />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {periodRecords.slice(0, 10).map((record) => {
                const employee = mockEmployees.find((emp) => emp.id === record.employeeId)
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{employee?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee?.name}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(record.date), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-center">
                        <p>{record.clockIn || "—"}</p>
                        <p className="text-muted-foreground">Clock In</p>
                      </div>
                      <div className="text-sm text-center">
                        <p>{record.clockOut || "—"}</p>
                        <p className="text-muted-foreground">Clock Out</p>
                      </div>
                      <div className="text-sm text-center">
                        <p>{record.hoursWorked}h</p>
                        <p className="text-muted-foreground">Hours</p>
                      </div>
                      <Badge
                        variant={
                          record.status === "present"
                            ? "default"
                            : record.status === "late"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
