"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  List,
  CalendarDays,
  User,
  Mail,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles,
} from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { useAuth } from "@/contexts/auth-context"
import { AttendanceCalendar, DayDetail } from "@/components/attendance-calendar"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import { AttendanceStatus, AttendanceMetric } from "@/components/attendance/attendance-ui"

interface AttendanceRecord {
  id: number
  date: string
  check_in_time: string | null
  check_out_time: string | null
  working_hours: number | null
  status: string | null
  is_late: boolean
  is_manual: boolean
  is_auto_clocked_out?: boolean
  notes: string | null
}

interface AttendanceSummary {
  total_days: number
  present_days: number
  absent_days: number
  half_days: number
  total_hours: number
  late_days: number
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export default function EmployeeAttendanceDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const userId = params.userId as string

  // Query parameter fallbacks for instant employee identity
  const paramName = searchParams.get("name") || ""
  const paramEmail = searchParams.get("email") || ""

  const [employeeInfo, setEmployeeInfo] = useState<{ name: string; email: string }>({
    name: paramName || "Employee",
    email: paramEmail || "",
  })

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [selectedDay, setSelectedDay] = useState<AttendanceRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch employee attendance data for selected month/year
  const fetchEmployeeAttendance = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient<any>(
        `/api/attendance/employee/${userId}?month=${selectedMonth}&year=${selectedYear}`
      )
      setRecords(Array.isArray(data.records) ? data.records : [])
      setSummary(data.summary || null)
    } catch (err: any) {
      logger.error("Error fetching employee attendance:", err)
      setError(err.message || "Failed to load employee attendance records.")
    } finally {
      setLoading(false)
    }
  }, [userId, selectedMonth, selectedYear])

  // Fallback employee name fetch if not present in query params
  useEffect(() => {
    if (!paramName) {
      apiClient<any>("/api/attendance/overview")
        .then((res) => {
          if (Array.isArray(res?.employees)) {
            const found = res.employees.find((e: any) => String(e.user_id) === String(userId))
            if (found) {
              setEmployeeInfo({
                name: found.employee_name || "Employee",
                email: found.employee_email || "",
              })
            }
          }
        })
        .catch(() => {})
    }
  }, [userId, paramName])

  useEffect(() => {
    if (user && userId) {
      fetchEmployeeAttendance()
    }
  }, [user?.id, userId, selectedMonth, selectedYear, fetchEmployeeAttendance])

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    })
  }

  // Summary statistics & rates
  const totalDays = summary?.total_days || 0
  const presentDays = summary?.present_days || 0
  const absentDays = summary?.absent_days || 0
  const halfDays = summary?.half_days || 0
  const lateDays = summary?.late_days || 0
  const totalHours = Number(summary?.total_hours || 0).toFixed(1)

  const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  return (
    <OwnerLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Top Header with Back Navigation */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-3.5">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border/70 hover:bg-accent shrink-0"
              onClick={() => router.push("/owner/attendance")}
              title="Return to Attendance Overview"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-0.5">
                <User className="h-3.5 w-3.5" /> Employee Profile · Attendance History
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <span>{employeeInfo.name}</span>
                {employeeInfo.email && (
                  <span className="text-xs font-normal text-muted-foreground hidden sm:inline-block">
                    ({employeeInfo.email})
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Month & Year Navigation Selector */}
          <div className="flex items-center gap-2 bg-card border border-border/70 rounded-2xl p-1.5 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent font-semibold text-xs text-foreground focus:outline-none cursor-pointer py-1"
              >
                {MONTHS.map((month, idx) => (
                  <option key={idx} value={idx + 1} className="bg-popover text-foreground">
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent font-semibold text-xs text-foreground focus:outline-none cursor-pointer py-1"
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year} className="bg-popover text-foreground">
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs border-rose-300" onClick={fetchEmployeeAttendance}>
              Retry
            </Button>
          </div>
        )}

        {/* Monthly Attendance Overview KPIs */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <AttendanceMetric
              label="Tracked Days"
              value={totalDays}
              detail={`${presentDays} days worked`}
              icon={<Calendar className="h-4 w-4" />}
              tone="slate"
            />

            <AttendanceMetric
              label="Present"
              value={presentDays}
              percent={attendancePercent}
              detail={`${attendancePercent}% attendance`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="green"
            />

            <AttendanceMetric
              label="Absent"
              value={absentDays}
              percent={totalDays > 0 ? Math.round((absentDays / totalDays) * 100) : 0}
              detail="Unrecorded shifts"
              icon={<XCircle className="h-4 w-4" />}
              tone="rose"
            />

            <AttendanceMetric
              label="Half Days"
              value={halfDays}
              detail="Early departure"
              icon={<AlertCircle className="h-4 w-4" />}
              tone="orange"
            />

            <AttendanceMetric
              label="Late Arrivals"
              value={lateDays}
              detail={`${presentDays > 0 ? Math.round((lateDays / presentDays) * 100) : 0}% of shifts`}
              icon={<Clock className="h-4 w-4" />}
              tone="amber"
            />

            <AttendanceMetric
              label="Total Hours"
              value={`${totalHours}h`}
              detail="Cumulative logged"
              icon={<TrendingUp className="h-4 w-4" />}
              tone="blue"
            />
          </div>
        )}

        {/* Main Content Card: List or Calendar View */}
        <Card className="border border-border/70 shadow-xs overflow-hidden">
          <CardHeader className="py-4 px-4 sm:px-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  Monthly Attendance Records · {MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                {records.length} total shifts recorded for this period.
              </CardDescription>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/70 self-start sm:self-auto">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs font-semibold gap-1.5 rounded-lg"
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
                List View
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs font-semibold gap-1.5 rounded-lg"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendar View
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4 p-4 border border-border/40 rounded-xl animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-40 bg-muted/60 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-6 w-20 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            ) : viewMode === "calendar" ? (
              <div className="max-w-3xl mx-auto py-2">
                <AttendanceCalendar
                  records={records}
                  month={selectedMonth}
                  year={selectedYear}
                  onDayClick={(day) => setSelectedDay(day)}
                />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mx-auto">
                  <CalendarDays className="h-6 w-6 opacity-60" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">No records for this month</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    There are no recorded shifts or punches for {MONTHS[selectedMonth - 1]} {selectedYear}. Use the month selector above to inspect other periods.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {records.map((record) => {
                  const dayDate = new Date(record.date)
                  const dayNum = dayDate.getDate()
                  const dayName = dayDate.toLocaleDateString("en-IN", { weekday: "short" })

                  return (
                    <div
                      key={record.id}
                      onClick={() => setSelectedDay(record)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-border/60 hover:bg-muted/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Day pill */}
                        <div className="flex flex-col items-center justify-center min-w-[50px] h-12 rounded-xl bg-muted/40 border border-border/70 group-hover:border-primary/30 transition-colors">
                          <span className="text-lg font-bold tracking-tight text-foreground leading-none">
                            {dayNum}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                            {dayName}
                          </span>
                        </div>

                        {/* Date & times */}
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-2">
                            <span>{formatDate(record.date)}</span>
                            {record.is_auto_clocked_out && (
                              <Badge variant="outline" className="text-[10px] py-0 border-blue-400 text-blue-700 dark:text-blue-300">
                                Auto Clock-Out
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3 text-muted-foreground/70" /> In: {formatTime(record.check_in_time)}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3 text-muted-foreground/70" /> Out: {formatTime(record.check_out_time)}
                            </span>
                          </div>

                          {record.notes && (
                            <p className="text-[11px] text-muted-foreground/80 mt-1 italic">
                              Note: {record.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Working hours & status */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                            Logged
                          </span>
                          <span className="font-bold text-sm sm:text-base font-mono tabular-nums text-foreground">
                            {record.working_hours ? `${Number(record.working_hours).toFixed(1)}h` : "—"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <AttendanceStatus
                            status={record.status || (record.check_in_time ? "present" : "absent")}
                            isLate={record.is_late}
                          />

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDay(record)
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Day Detail Dialog */}
      {selectedDay && (
        <DayDetail day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </OwnerLayout>
  )
}
