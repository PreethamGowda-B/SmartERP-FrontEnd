"use client"

import { useState, useEffect, useCallback } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { SmartClockInOut } from "@/components/smart-clock-in-out"
import { MonthlyAttendanceChart } from "@/components/monthly-attendance-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, TrendingUp, Award, Loader2 } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

interface AttendanceRecord {
  id: number
  date: string
  clockIn: string | null
  clockOut: string | null
  hoursWorked: number
  status: string
  location: string | null
}

interface MonthlyStats {
  present: number
  late: number
  absent: number
  totalHours: number
  attendancePercent: number
  workingDays: number
  avgHoursPerDay: number
}

export default function EmployeeTimePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMyAttendance = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/attendance/me`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load attendance")
      const data = await res.json()
      setRecords(data.records || [])
      setStats(data.stats || null)
    } catch (err: any) {
      setError(err.message || "Could not load attendance data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMyAttendance()
  }, [fetchMyAttendance])

  // Weekly hours: sum of hoursWorked for records in the current week (Mon-Sun)
  const weeklyHours = (() => {
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Mon=0
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek)
    monday.setHours(0, 0, 0, 0)

    return records
      .filter((r) => {
        const d = new Date(r.date)
        return d >= monday && d <= now
      })
      .reduce((sum, r) => sum + r.hoursWorked, 0)
      .toFixed(1)
  })()

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-balance">Time Tracking</h1>
          <p className="text-muted-foreground">Track your work hours and view attendance history</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyHours}h</div>
              <p className="text-xs text-muted-foreground">
                {(40 - Number(weeklyHours)) > 0 ? `${(40 - Number(weeklyHours)).toFixed(1)}h to reach 40h` : "Target reached!"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalHours ?? 0}h</div>
              <p className="text-xs text-muted-foreground">{stats?.totalDaysWorked ?? 0} days worked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.attendancePercent ?? 0}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.late ?? 0}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Clock In/Out widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SmartClockInOut />
          </div>
          {/* Today's summary card */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Today's Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const today = new Date().toISOString().split("T")[0]
                const todayRec = records.find((r) => r.date === today)
                if (!todayRec) {
                  return <p className="text-muted-foreground text-sm">No record for today yet.</p>
                }
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Status</span>
                      <Badge variant={todayRec.status === "present" ? "default" : todayRec.status === "late" ? "secondary" : "destructive"}>
                        {todayRec.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Clock In</p>
                        <p className="font-semibold">{todayRec.clockIn || "—"}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Clock Out</p>
                        <p className="font-semibold">{todayRec.clockOut || "—"}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Hours Worked</p>
                      <p className="text-xl font-bold text-blue-600">{todayRec.hoursWorked}h</p>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Attendance Chart */}
        {stats && (
          <MonthlyAttendanceChart
            data={{
              totalPresents: stats.present,
              totalLates: stats.late,
              totalAbsents: stats.absent,
              totalHolidays: 0,
              workingDays: stats.workingDays,
            }}
          />
        )}

        {/* Recent Time Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
            <CardDescription>Your latest work sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : records.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No attendance records yet.</p>
            ) : (
              <div className="space-y-3">
                {records.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(record.date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric"
                        })}
                      </p>
                      {record.location && (
                        <p className="text-sm text-muted-foreground">{record.location}</p>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground">{record.clockIn || "—"} → {record.clockOut || "—"}</p>
                        <p className="font-medium">{record.hoursWorked}h</p>
                      </div>
                      <Badge
                        variant={
                          record.status === "present" ? "default"
                            : record.status === "late" ? "secondary"
                            : record.status === "clocked-in" ? "outline"
                            : "destructive"
                        }
                        className="text-xs w-20 justify-center"
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  )
}
