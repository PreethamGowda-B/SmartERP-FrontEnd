"use client"

import { useState, useEffect, useCallback } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Users, TrendingUp, AlertTriangle, Download, ArrowLeft, Loader2, ChevronRight } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

// ─── Types ──────────────────────────────────────────────────────────────────
interface EmployeeSummary {
  userId: number
  name: string
  email: string
  position: string
  stats: MonthlyStats
  records: AttendanceRecord[]
}

interface MonthlyStats {
  year: number
  month: number
  workingDays: number
  present: number
  late: number
  absent: number
  totalDaysWorked: number
  totalHours: number
  avgHoursPerDay: number
  attendancePercent: number
}

interface AttendanceRecord {
  id: number
  userId: number
  date: string
  clockIn: string | null
  clockOut: string | null
  hoursWorked: number
  status: string
  location: string | null
}

interface EmployeeDetail {
  employee: {
    id: number
    name: string
    email: string
    position: string
    phone: string | null
    department: string | null
    hireDate: string | null
    isActive: boolean
  }
  stats: MonthlyStats
  prevStats: MonthlyStats
  records: AttendanceRecord[]
  year: number
  month: number
}

// ─── Month names helper ─────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

// ─── Main page ──────────────────────────────────────────────────────────────
export default function OwnerAttendancePage() {
  // List view state
  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Month selector — default to current month
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1) // 1-based

  // Detail view state
  const [detailView, setDetailView] = useState<EmployeeDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ─── Fetch all employees' attendance for selected month ───────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API}/api/attendance/all?year=${selectedYear}&month=${selectedMonth}`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error("Failed to load attendance data")
      const data = await res.json()
      setEmployees(data.employees || [])
    } catch (err: any) {
      setError(err.message || "Could not load attendance")
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ─── Fetch single employee detail ─────────────────────────────────────────
  const openDetail = async (userId: number) => {
    setDetailLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API}/api/attendance/employee/${userId}?year=${selectedYear}&month=${selectedMonth}`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error("Failed to load employee detail")
      const data = await res.json()
      setDetailView(data)
    } catch (err: any) {
      setError(err.message || "Could not load employee detail")
    } finally {
      setDetailLoading(false)
    }
  }

  // ─── Export CSV ───────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = [["Employee","Date","Clock In","Clock Out","Hours","Status"]]
    employees.forEach((emp) => {
      emp.records.forEach((r) => {
        rows.push([emp.name, r.date, r.clockIn || "—", r.clockOut || "—", String(r.hoursWorked), r.status])
      })
    })
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-${selectedYear}-${String(selectedMonth).padStart(2,"0")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ─── Month navigation ─────────────────────────────────────────────────────
  const goToPrevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }
  const goToNextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  // ─── Aggregate stats across all employees (for the top cards) ─────────────
  const teamStats = {
    totalHours: employees.reduce((s, e) => s + e.stats.totalHours, 0).toFixed(1),
    present: employees.reduce((s, e) => s + e.stats.present, 0),
    late: employees.reduce((s, e) => s + e.stats.late, 0),
    absent: employees.reduce((s, e) => s + e.stats.absent, 0),
    avgAttendance: employees.length > 0
      ? (employees.reduce((s, e) => s + e.stats.attendancePercent, 0) / employees.length).toFixed(1)
      : "0",
  }

  // ─── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (detailView) {
    const { employee, stats, prevStats, records } = detailView
    const trend = stats.attendancePercent - prevStats.attendancePercent

    // Build a day-by-day map for the calendar-style list
    const recordsByDate: Record<string, AttendanceRecord> = {}
    records.forEach((r) => { recordsByDate[r.date] = r })

    // Generate all working days in the month to show absences explicitly
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    const allDays: { date: string; record: AttendanceRecord | null; isWorkday: boolean }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, d)
      const dow = dateObj.getDay()
      const isWorkday = dow !== 0 && dow !== 6
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`
      allDays.push({ date: dateStr, record: recordsByDate[dateStr] || null, isWorkday })
    }
    // Only show workdays, sorted most recent first
    const workdays = allDays.filter((d) => d.isWorkday).reverse()

    return (
      <OwnerLayout>
        <div className="space-y-6">
          {/* Back button + header */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setDetailView(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{employee.name}</h1>
              <p className="text-sm text-muted-foreground">{employee.position} · {employee.email}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">{error}</div>
          )}

          {/* Month label */}
          <p className="text-sm font-medium text-muted-foreground">
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </p>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                <p className="text-2xl font-bold text-blue-600">{stats.attendancePercent}%</p>
                <p className="text-xs text-muted-foreground">
                  {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}% vs last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Late</p>
                <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">of {stats.workingDays} working days</p>
              </CardContent>
            </Card>
          </div>

          {/* Total hours + avg */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
                <p className="text-2xl font-bold">{stats.totalHours}h</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Avg Hours / Day</p>
                <p className="text-2xl font-bold">{stats.avgHoursPerDay}h</p>
              </CardContent>
            </Card>
          </div>

          {/* Day-by-day attendance list (matches screenshot layout) */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>All working days this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workdays.map(({ date, record }) => {
                  const dateObj = new Date(date + "T12:00:00")
                  const dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  const status = record
                    ? (record.hoursWorked > 0 ? record.status : "clocked-in")
                    : "absent"

                  return (
                    <div key={date} className="flex items-center justify-between p-3 border rounded-lg">
                      {/* Left: avatar + name + date */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{dateLabel}</p>
                        </div>
                      </div>
                      {/* Right: clock in / clock out / hours / badge */}
                      <div className="flex items-center gap-4">
                        <div className="text-center text-sm">
                          <p className="font-medium">{record?.clockIn || "—"}</p>
                          <p className="text-xs text-muted-foreground">Clock In</p>
                        </div>
                        <div className="text-center text-sm">
                          <p className="font-medium">{record?.clockOut || "—"}</p>
                          <p className="text-xs text-muted-foreground">Clock Out</p>
                        </div>
                        <div className="text-center text-sm w-12">
                          <p className="font-medium">{record ? `${record.hoursWorked}h` : "0h"}</p>
                          <p className="text-xs text-muted-foreground">Hours</p>
                        </div>
                        <Badge
                          variant={status === "present" ? "default" : status === "late" ? "secondary" : "destructive"}
                          className="w-20 justify-center text-xs"
                        >
                          {status}
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

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Attendance Management</h1>
            <p className="text-muted-foreground">Monitor and manage employee attendance and time tracking</p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">{error}</div>
        )}

        {/* Month navigator */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToPrevMonth}> ← </Button>
          <span className="font-semibold text-base min-w-[140px] text-center">
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextMonth}> → </Button>
          {/* Quick jump to current month */}
          {(selectedYear !== now.getFullYear() || selectedMonth !== now.getMonth() + 1) && (
            <Button variant="link" size="sm" onClick={() => { setSelectedYear(now.getFullYear()); setSelectedMonth(now.getMonth() + 1) }}>
              Today
            </Button>
          )}
        </div>

        {/* Team overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">Team this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.avgAttendance}%</div>
              <p className="text-xs text-muted-foreground">Across all employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{teamStats.late}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{teamStats.absent}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Employee list — clickable rows */}
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>Click on any employee to see their full attendance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : employees.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No employees found.</p>
            ) : (
              <div className="space-y-3">
                {employees.map((emp) => {
                  const pct = emp.stats.attendancePercent
                  const badgeVariant = pct >= 95 ? "default" : pct >= 80 ? "secondary" : "destructive"
                  const badgeLabel = pct >= 95 ? "Excellent" : pct >= 80 ? "Good" : "Needs Attention"

                  return (
                    <div
                      key={emp.userId}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openDetail(emp.userId)}
                    >
                      {/* Left */}
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-sm text-muted-foreground">{emp.position}</p>
                        </div>
                      </div>
                      {/* Right: stats + badge + arrow */}
                      <div className="flex items-center gap-5">
                        <div className="text-center text-sm">
                          <p className="font-semibold">{emp.stats.totalHours}h</p>
                          <p className="text-xs text-muted-foreground">Hours</p>
                        </div>
                        <div className="text-center text-sm">
                          <p className="font-semibold text-green-600">{emp.stats.present}</p>
                          <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                        <div className="text-center text-sm">
                          <p className="font-semibold text-orange-600">{emp.stats.late}</p>
                          <p className="text-xs text-muted-foreground">Late</p>
                        </div>
                        <div className="text-center text-sm">
                          <p className="font-semibold text-red-600">{emp.stats.absent}</p>
                          <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                        <div className="text-center text-sm">
                          <p className="font-semibold">{pct}%</p>
                          <p className="text-xs text-muted-foreground">Rate</p>
                        </div>
                        <Badge variant={badgeVariant} className="w-[120px] justify-center">
                          {badgeLabel}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity — latest records across all employees, matching screenshot style */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Flatten all records, sort by date desc, take top 15 */}
                {employees
                  .flatMap((emp) => emp.records.map((r) => ({ ...r, employeeName: emp.name })))
                  .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
                  .slice(0, 15)
                  .map((record) => {
                    const dateObj = new Date(record.date + "T12:00:00")
                    const dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

                    return (
                      <div key={`${record.userId}-${record.date}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{record.employeeName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{record.employeeName}</p>
                            <p className="text-xs text-muted-foreground">{dateLabel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center text-sm">
                            <p className="font-medium">{record.clockIn || "—"}</p>
                            <p className="text-xs text-muted-foreground">Clock In</p>
                          </div>
                          <div className="text-center text-sm">
                            <p className="font-medium">{record.clockOut || "—"}</p>
                            <p className="text-xs text-muted-foreground">Clock Out</p>
                          </div>
                          <div className="text-center text-sm w-12">
                            <p className="font-medium">{record.hoursWorked}h</p>
                            <p className="text-xs text-muted-foreground">Hours</p>
                          </div>
                          <Badge
                            variant={record.status === "present" ? "default" : record.status === "late" ? "secondary" : "destructive"}
                            className="w-20 justify-center text-xs"
                          >
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
