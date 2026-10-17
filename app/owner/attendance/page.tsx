"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
  Settings2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  CalendarDays,
  X,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import { ExportButton } from "@/components/export-button"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import {
  AttendanceStatus,
  AttendanceMetric,
  AttendanceWorkforceDistribution,
  AttendancePageHeader,
} from "@/components/attendance/attendance-ui"

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
  is_auto_clocked_out?: boolean
  on_leave?: boolean
  department?: string
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  half_day?: number
  on_leave?: number
}

interface AttendancePolicy {
  timezone: string
  shiftStart: string
  shiftEnd: string
  earliestClockIn: string
  lateThreshold: string
  gracePeriodMinutes: number
  halfDayThreshold: string
  clockInCutoff: string
  automaticClockOutEnabled: boolean
  automaticClockOutTime: string
  earlyDepartureIsHalfDay: boolean
  workingHoursRounding: number
}

type FilterStatus = "all" | "present" | "late" | "half_day" | "on_leave" | "absent"

export default function OwnerAttendancePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeAttendance[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    half_day: 0,
    on_leave: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split("T")[0])

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")

  // Policy configuration state
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null)
  const [policySaving, setPolicySaving] = useState(false)
  const [policyMessage, setPolicyMessage] = useState("")
  const [policyExpanded, setPolicyExpanded] = useState(false)

  const fetchAttendanceOverview = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const data = await apiClient<any>("/api/attendance/overview")
      const rawEmployees: EmployeeAttendance[] = Array.isArray(data.employees) ? data.employees : []
      setEmployees(rawEmployees)

      const halfDayCount = rawEmployees.filter((e) => e.status === "half_day").length

      setSummary(
        data.summary
          ? { ...data.summary, half_day: halfDayCount }
          : { total: 0, present: 0, absent: 0, late: 0, half_day: 0, on_leave: 0 }
      )
    } catch (err: any) {
      logger.error("Error fetching attendance overview:", err)
      setError(err.message || "Failed to load live attendance overview.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  const fetchPolicy = useCallback(async () => {
    try {
      const data = await apiClient<any>("/api/attendance/policy")
      if (data?.policy) setPolicy(data.policy)
      if (data?.work_date) setWorkDate(data.work_date)
    } catch (err) {
      logger.error("Error fetching attendance policy:", err)
    }
  }, [])

  const savePolicy = async () => {
    if (!policy) return
    setPolicySaving(true)
    setPolicyMessage("")
    try {
      const data = await apiClient<any>("/api/attendance/policy", {
        method: "PUT",
        body: JSON.stringify({ policy }),
      })
      setPolicy(data.policy)
      setPolicyMessage("Attendance policy saved successfully. Applied to future punches.")
      setTimeout(() => setPolicyMessage(""), 5000)
    } catch (err: any) {
      setPolicyMessage(err.message || "Could not save attendance policy")
    } finally {
      setPolicySaving(false)
    }
  }

  const refreshAttendance = async () => {
    setRefreshing(true)
    await Promise.allSettled([fetchAttendanceOverview(false), fetchPolicy()])
    setRefreshing(false)
  }

  useEffect(() => {
    if (user) {
      fetchAttendanceOverview(true)
      fetchPolicy()
    }
  }, [user?.id, fetchAttendanceOverview, fetchPolicy])

  // Periodic polling & focus sync
  useEffect(() => {
    const timer = setInterval(() => fetchAttendanceOverview(false), 30000)
    const onFocus = () => {
      fetchAttendanceOverview(false)
      fetchPolicy()
    }
    const onAttendanceChange = () => fetchAttendanceOverview(false)

    window.addEventListener("focus", onFocus)
    window.addEventListener("attendance-status-changed", onAttendanceChange)

    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("attendance-status-changed", onAttendanceChange)
    }
  }, [fetchAttendanceOverview, fetchPolicy])

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: policy?.timezone || "Asia/Kolkata",
    })
  }

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_email.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      // Status tab filter
      if (statusFilter === "all") return true
      if (statusFilter === "on_leave") return Boolean(emp.on_leave && !emp.check_in_time)
      if (statusFilter === "absent") return !emp.check_in_time && !emp.on_leave
      if (statusFilter === "late") return Boolean(emp.is_late || emp.status === "late")
      if (statusFilter === "half_day") return emp.status === "half_day"
      if (statusFilter === "present") return Boolean(emp.check_in_time)

      return true
    })
  }, [employees, searchQuery, statusFilter])

  // Percentage calculations
  const totalStaff = Number(summary.total || 0)
  const presentCount = Number(summary.present || 0)
  const absentCount = Number(summary.absent || 0)
  const lateCount = Number(summary.late || 0)
  const halfDayCount = Number(summary.half_day || 0)
  const onLeaveCount = Number(summary.on_leave || 0)

  const attendanceRate = totalStaff > 0 ? Math.round((presentCount / totalStaff) * 100) : 0
  const lateRate = presentCount > 0 ? Math.round((lateCount / presentCount) * 100) : 0

  const handleKpiClick = (filter: FilterStatus) => {
    setStatusFilter((current) => (current === filter ? "all" : filter))
  }

  return (
    <OwnerLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Executive Header */}
        <AttendancePageHeader
          title="Attendance Management"
          description="Executive supervision, live shift check-ins, exceptions, and team coverage."
          badgeText="Live · 30s auto-sync"
          workDate={workDate}
          timezone={policy?.timezone || "Asia/Kolkata"}
          onRefresh={refreshAttendance}
          refreshing={refreshing}
          actions={
            <ExportButton
              filename={`Attendance_Report_${workDate || new Date().toISOString().split("T")[0]}`}
              title="Employee Attendance Report"
              subtitle="Workforce Shift & Attendance Audit Trail"
              onExport={async () => {
                const now = new Date()
                const month = now.getMonth() + 1
                const year = now.getFullYear()
                const data = await apiClient<any>(`/api/attendance/report?month=${month}&year=${year}`)

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
                          working_hours: rec.hours,
                        })
                      })
                    } else {
                      flatData.push({
                        employee_name: emp.employee.name,
                        employee_email: emp.employee.email,
                        date: "—",
                        check_in: "—",
                        check_out: "—",
                        status: "No Data",
                        working_hours: 0,
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
                { header: "Hours", dataKey: "working_hours", type: "number" },
              ]}
            />
          }
        />

        {/* Error notification banner if fetch failed */}
        {error && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs border-rose-300" onClick={refreshAttendance}>
              Retry
            </Button>
          </div>
        )}

        {/* Policy Summary & Manage Policy Accordion */}
        {policy && user?.role === "owner" && (
          <Card className="border border-border/70 shadow-xs overflow-hidden transition-all bg-card/60">
            <CardHeader
              role="button"
              tabIndex={0}
              onClick={() => setPolicyExpanded((open) => !open)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setPolicyExpanded((open) => !open)
                }
              }}
              aria-expanded={policyExpanded}
              className="flex cursor-pointer flex-row items-center justify-between gap-4 py-3.5 px-4 sm:px-6 hover:bg-muted/30 transition-colors select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Settings2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                      Company Shift Policy
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono py-0 text-muted-foreground border-border/80">
                      {policy.timezone}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Shift {policy.shiftStart}–{policy.shiftEnd} · Cutoff {policy.clockInCutoff} · Auto clock-out{" "}
                    {policy.automaticClockOutEnabled ? policy.automaticClockOutTime : "Disabled"} · Grace {policy.gracePeriodMinutes}m
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-primary hidden sm:inline">
                  {policyExpanded ? "Hide Settings" : "Configure Rules"}
                </span>
                <span className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", policyExpanded && "rotate-180")} />
                </span>
              </div>
            </CardHeader>

            {policyExpanded && (
              <CardContent className="space-y-4 border-t border-border/60 bg-muted/15 pt-5 pb-6 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Company-wide parameters for employee clock-ins, automatic shift closures, and attendance audits.
                  </p>
                  <span className="text-[11px] text-muted-foreground/80 font-mono">
                    Timezone: {policy.timezone}
                  </span>
                </div>

                <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {([
                    ["Shift start", "shiftStart"],
                    ["Shift end", "shiftEnd"],
                    ["Earliest clock-in", "earliestClockIn"],
                    ["Late cutoff", "lateThreshold"],
                    ["Half-day threshold", "halfDayThreshold"],
                    ["Clock-in cutoff", "clockInCutoff"],
                    ["Auto clock-out time", "automaticClockOutTime"],
                  ] as const).map(([label, field]) => (
                    <label key={field} className="space-y-1 block text-xs">
                      <span className="font-semibold text-foreground/85">{label}</span>
                      <Input
                        type="time"
                        className="h-9 text-xs font-mono bg-background"
                        value={policy[field]}
                        onChange={(e) => setPolicy({ ...policy, [field]: e.target.value })}
                      />
                    </label>
                  ))}

                  <label className="space-y-1 block text-xs">
                    <span className="font-semibold text-foreground/85">Grace period (mins)</span>
                    <Input
                      type="number"
                      min={0}
                      max={180}
                      className="h-9 text-xs bg-background"
                      value={policy.gracePeriodMinutes}
                      onChange={(e) => setPolicy({ ...policy, gracePeriodMinutes: Number(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                      checked={policy.automaticClockOutEnabled}
                      onChange={(e) => setPolicy({ ...policy, automaticClockOutEnabled: e.target.checked })}
                    />
                    <span>Automatic clock-out at end of shift</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                      checked={policy.earlyDepartureIsHalfDay}
                      onChange={(e) => setPolicy({ ...policy, earlyDepartureIsHalfDay: e.target.checked })}
                    />
                    <span>Flag departure before half-day threshold as half-day</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button size="sm" onClick={savePolicy} disabled={policySaving} className="h-8 text-xs font-semibold">
                    {policySaving ? "Saving Policy..." : "Save Attendance Policy"}
                  </Button>
                  {policyMessage && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {policyMessage}
                    </span>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Top KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <AttendanceMetric
            label="Total Staff"
            value={totalStaff}
            detail={`${presentCount} active today`}
            icon={<Users className="h-4 w-4" />}
            tone="slate"
            active={statusFilter === "all"}
            onClick={() => handleKpiClick("all")}
          />

          <AttendanceMetric
            label="Present"
            value={presentCount}
            percent={attendanceRate}
            detail={`${totalStaff > 0 ? `${attendanceRate}% rate` : "No staff"}`}
            icon={<UserCheck className="h-4 w-4" />}
            tone="green"
            active={statusFilter === "present"}
            onClick={() => handleKpiClick("present")}
          />

          <AttendanceMetric
            label="Absent"
            value={absentCount}
            percent={totalStaff > 0 ? Math.round((absentCount / totalStaff) * 100) : 0}
            detail="Unexcused missing"
            icon={<UserX className="h-4 w-4" />}
            tone="rose"
            active={statusFilter === "absent"}
            onClick={() => handleKpiClick("absent")}
          />

          <AttendanceMetric
            label="Late Arrivals"
            value={lateCount}
            percent={lateRate}
            detail={`${lateRate}% of present`}
            icon={<Clock className="h-4 w-4" />}
            tone="amber"
            active={statusFilter === "late"}
            onClick={() => handleKpiClick("late")}
          />

          <AttendanceMetric
            label="Half Day"
            value={halfDayCount}
            detail="Partial shift logged"
            icon={<AlertCircle className="h-4 w-4" />}
            tone="orange"
            active={statusFilter === "half_day"}
            onClick={() => handleKpiClick("half_day")}
          />

          <AttendanceMetric
            label="On Leave"
            value={onLeaveCount}
            detail="Approved leave"
            icon={<CalendarCheck className="h-4 w-4" />}
            tone="sky"
            active={statusFilter === "on_leave"}
            onClick={() => handleKpiClick("on_leave")}
          />
        </div>

        {/* Workforce Coverage Distribution Bar */}
        <AttendanceWorkforceDistribution
          present={presentCount}
          late={lateCount}
          halfDay={halfDayCount}
          onLeave={onLeaveCount}
          absent={absentCount}
          total={totalStaff}
        />

        {/* Workforce Directory & Live Status Table */}
        <Card className="border border-border/70 shadow-xs overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                <span>Employee Attendance Directory</span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({filteredEmployees.length} of {employees.length} records)
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any employee to view their full monthly attendance history and calendar.
              </p>
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(
                [
                  { id: "all", label: "All", count: employees.length },
                  { id: "present", label: "Present", count: presentCount },
                  { id: "late", label: "Late", count: lateCount },
                  { id: "on_leave", label: "On Leave", count: onLeaveCount },
                  { id: "absent", label: "Absent", count: absentCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-semibold transition-all border text-xs",
                    statusFilter === tab.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  {tab.label} <span className="text-[10px] opacity-80 tabular-nums">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar & Reset Toolbar */}
          <div className="px-4 py-3 bg-muted/20 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter by employee name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-background rounded-lg border-border/70"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Table Content */}
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-border/40 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-36 bg-muted rounded" />
                        <div className="h-3 w-48 bg-muted/60 rounded" />
                      </div>
                    </div>
                    <div className="h-3.5 w-20 bg-muted rounded hidden sm:block" />
                    <div className="h-3.5 w-20 bg-muted rounded hidden sm:block" />
                    <div className="h-6 w-16 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mx-auto">
                  <Users className="h-6 w-6 opacity-60" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">No attendance records found</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {searchQuery || statusFilter !== "all"
                      ? "No employees match your active search or status filter. Try clearing filters."
                      : "No employee shift activity has been recorded for today yet."}
                  </p>
                </div>
                {(searchQuery || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("all")
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6">Employee</th>
                      <th className="py-3 px-3">Check In</th>
                      <th className="py-3 px-3">Check Out</th>
                      <th className="py-3 px-3">Duration</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredEmployees.map((emp) => {
                      const initial = (emp.employee_name || "E").charAt(0).toUpperCase()
                      const isWorking = Boolean(emp.check_in_time && !emp.check_out_time)

                      return (
                        <tr
                          key={emp.user_id}
                          onClick={() => router.push(`/owner/attendance/${emp.user_id}`)}
                          className="hover:bg-muted/40 transition-colors cursor-pointer group"
                        >
                          {/* Employee name & avatar */}
                          <td className="py-3 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-bold text-xs border border-primary/10 select-none">
                                {initial}
                                {isWorking && (
                                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-background" />
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                  {emp.employee_name}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {emp.employee_email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Check In */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-medium text-foreground">
                              {formatTime(emp.check_in_time)}
                            </span>
                            {emp.is_late && (
                              <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                Late
                              </span>
                            )}
                          </td>

                          {/* Check Out */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-medium text-foreground">
                              {formatTime(emp.check_out_time)}
                            </span>
                            {emp.is_auto_clocked_out && (
                              <span className="block text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                Auto-Closed
                              </span>
                            )}
                          </td>

                          {/* Working Hours */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums text-foreground">
                            {emp.working_hours ? `${Number(emp.working_hours || 0).toFixed(1)}h` : "—"}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <AttendanceStatus
                              status={
                                emp.on_leave && !emp.check_in_time
                                  ? "on_leave"
                                  : isWorking
                                  ? "clocked-in"
                                  : emp.status || (!emp.check_in_time ? "absent" : "present")
                              }
                              isLate={emp.is_late}
                            />
                          </td>

                          {/* Detail Navigation Action */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                              <span>History</span>
                              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
