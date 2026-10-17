"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // ✅ Import useRouter
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, Clock, CalendarCheck, Settings2, RefreshCw, Activity, ChevronDown } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { useAuth } from "@/contexts/auth-context"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"

import { apiClient, getAuthToken } from "@/lib/apiClient"
import { ExportButton } from "@/components/export-button"
import { logger } from "@/lib/logger"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { EnterpriseDataTable } from "@/components/data-table/enterprise-data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
  on_leave?: boolean
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
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

export default function OwnerAttendancePage() {
  const router = useRouter() // ✅ Add router hook
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeAttendance[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    on_leave: 0,
  })
  const [loading, setLoading] = useState(true)
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null)
  const [policySaving, setPolicySaving] = useState(false)
  const [policyMessage, setPolicyMessage] = useState("")
  const [policyExpanded, setPolicyExpanded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAttendanceOverview = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await apiClient("/api/attendance/overview")
      setEmployees(Array.isArray(data.employees) ? data.employees : [])
      setSummary(data.summary || { total: 0, present: 0, absent: 0, late: 0, on_leave: 0 })
    } catch (err: any) {
      logger.error("Error fetching attendance overview:", err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const fetchPolicy = async () => {
    try {
      const data = await apiClient("/api/attendance/policy")
      setPolicy(data.policy)
    } catch (err) {
      logger.error("Error fetching attendance policy:", err)
    }
  }

  const savePolicy = async () => {
    if (!policy) return
    setPolicySaving(true)
    setPolicyMessage("")
    try {
      const data = await apiClient("/api/attendance/policy", { method: "PUT", body: JSON.stringify({ policy }) })
      setPolicy(data.policy)
      setPolicyMessage("Attendance policy saved. Existing attendance rows are not changed.")
    } catch (err: any) {
      setPolicyMessage(err.message || "Could not save attendance policy")
    } finally {
      setPolicySaving(false)
    }
  }

  const refreshAttendance = async () => {
    setRefreshing(true)
    await fetchAttendanceOverview(false)
    setRefreshing(false)
  }

  useEffect(() => {
    if (user) {
      fetchAttendanceOverview()
      fetchPolicy()
    }
  }, [user?.id])

  useEffect(() => {
    const timer = setInterval(() => fetchAttendanceOverview(false), 30000)
    const onFocus = () => { fetchAttendanceOverview(false); fetchPolicy() }
    window.addEventListener("focus", onFocus)
    const onAttendanceChange = () => { fetchAttendanceOverview(false) }
    window.addEventListener("attendance-status-changed", onAttendanceChange)
    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("attendance-status-changed", onAttendanceChange)
    }
  }, [user?.id])

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    })
  }

  const getStatusBadge = (employee: EmployeeAttendance) => {
    if (employee.on_leave && !employee.check_in_time) {
      return <Badge className="bg-cyan-600">On Leave</Badge>
    }
    if (!employee.check_in_time) {
      return <Badge variant="destructive">Absent</Badge>
    }

    if (!employee.check_out_time) {
      return <Badge className="bg-blue-500">Checked In</Badge>
    }

    switch (employee.status) {
      case "present":
        return <Badge className="bg-green-500">Present</Badge>
      case "late":
        return <Badge className="bg-orange-500">Late</Badge>
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
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
              <Activity className="h-3.5 w-3.5" /> Workforce operations
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground mt-1">A live view of today’s shift, exceptions, and team coverage.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-9 px-3 rounded-full gap-2 border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live · 30 sec sync</Badge>
            <Button variant="outline" className="h-9 gap-2 rounded-xl" onClick={refreshAttendance} disabled={refreshing}><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh</Button>
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
        </div>

        {policy && user?.role === "owner" && (
          <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader role="button" tabIndex={0} onClick={() => setPolicyExpanded((open) => !open)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setPolicyExpanded((open) => !open) } }} aria-expanded={policyExpanded} className="flex cursor-pointer flex-row items-center justify-between gap-4 py-4 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Settings2 className="h-5 w-5" /></span>
                  <div>
                    <CardTitle className="text-base">Attendance policy</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{policy.shiftStart}–{policy.shiftEnd} · cutoff {policy.clockInCutoff} · automatic clock-out {policy.automaticClockOutEnabled ? policy.automaticClockOutTime : "off"} · {policy.timezone}</p>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-primary">{policyExpanded ? "Hide settings" : "Manage policy"}<ChevronDown className={`h-4 w-4 transition-transform ${policyExpanded ? "rotate-180" : ""}`} /></span>
              </CardHeader>
            {policyExpanded && <CardContent className="space-y-4 border-t bg-muted/10 pt-5">
              <p className="text-sm text-muted-foreground">Company-wide rules used by employee punches, attendance reports, and scheduled processing.</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {([
                  ["Shift starts", "shiftStart"], ["Shift ends", "shiftEnd"], ["Earliest clock-in", "earliestClockIn"],
                  ["Late threshold", "lateThreshold"], ["Half-day threshold", "halfDayThreshold"], ["Clock-in cutoff", "clockInCutoff"],
                  ["Automatic clock-out", "automaticClockOutTime"],
                ] as const).map(([label, field]) => (
                  <label key={field} className="space-y-1 text-sm">
                    <span className="font-medium">{label}</span>
                    <Input type="time" value={policy[field]} onChange={(e) => setPolicy({ ...policy, [field]: e.target.value })} />
                  </label>
                ))}
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Grace period (minutes)</span>
                  <Input type="number" min={0} max={180} value={policy.gracePeriodMinutes} onChange={(e) => setPolicy({ ...policy, gracePeriodMinutes: Number(e.target.value) })} />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Timezone</span>
                  <Input value={policy.timezone} readOnly aria-readonly="true" />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Hours rounding digits</span>
                  <Input type="number" min={0} max={2} value={policy.workingHoursRounding} onChange={(e) => setPolicy({ ...policy, workingHoursRounding: Number(e.target.value) })} />
                </label>
              </div>
              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={policy.automaticClockOutEnabled} onChange={(e) => setPolicy({ ...policy, automaticClockOutEnabled: e.target.checked })} /> Automatic clock-out</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={policy.earlyDepartureIsHalfDay} onChange={(e) => setPolicy({ ...policy, earlyDepartureIsHalfDay: e.target.checked })} /> Early departure is half-day</label>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={savePolicy} disabled={policySaving}>{policySaving ? "Saving…" : "Save attendance policy"}</Button>
                {policyMessage && <span className="text-sm text-muted-foreground">{policyMessage}</span>}
              </div>
            </CardContent>}
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          <Card className="premium-card hover-lift-subtle border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight">{Number(summary.total || 0)}</div>
            </CardContent>
          </Card>

          <Card className="premium-card hover-lift-subtle border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Present</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-green-600">{Number(summary.present || 0)}</div>
            </CardContent>
          </Card>

          <Card className="premium-card hover-lift-subtle border border-red-500/20 bg-gradient-to-br from-red-500/[0.06] to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Absent</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-red-600">{Number(summary.absent || 0)}</div>
            </CardContent>
          </Card>

          <Card className="premium-card hover-lift-subtle border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Late Arrivals</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-orange-600">{Number(summary.late || 0)}</div>
            </CardContent>
          </Card>

          <Card className="premium-card hover-lift-subtle border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">On Approved Leave</CardTitle>
              <CalendarCheck className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-cyan-600">{Number(summary.on_leave || 0)}</div>
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
