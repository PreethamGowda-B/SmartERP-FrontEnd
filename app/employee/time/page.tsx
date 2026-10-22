"use client"
import { getApiOrigin } from "@/lib/api-environment.mjs";

import { useCallback, useEffect, useMemo, useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { SmartClockInOut } from "@/components/smart-clock-in-out"
import { AttendanceMetric, AttendanceStatus } from "@/components/attendance/attendance-ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, RefreshCw } from "lucide-react"
import { getAccessToken } from "@/lib/apiClient"

const API = getApiOrigin()

interface AttendanceRecord {
  id: number
  date: string
  clockIn: string | null
  clockOut: string | null
  hoursWorked: number
  status: string
  location: string | null
  is_late?: boolean
}

interface MonthlyStats {
  daysPresent: number
  totalHours: number
  lateCount: number
  halfDayCount: number
}

const getStatusText = (record: AttendanceRecord) => record.clockIn && record.status === "absent" ? "Clocked in · review status" : record.status === "half_day" ? "Half day" : ["leave", "on_leave"].includes(record.status) ? "On leave" : record.status || "Pending"

export default function EmployeeTimePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const fetchMyAttendance = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError("")
    try {
      const token = getAccessToken()
      const res = await fetch(`${API}/api/attendance/me`, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error("Could not load attendance. Try refreshing.")
      const data = await res.json()
      setRecords(Array.isArray(data.records) ? data.records : [])
      setStats(data.stats || null)
    } catch (err: any) {
      setError(err?.message || "Could not load attendance data.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return
      if (typeof navigator !== "undefined" && !navigator.onLine) return
      fetchMyAttendance(false)
    }
    const timer = setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    window.addEventListener("attendance-status-changed", refresh)
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); window.removeEventListener("attendance-status-changed", refresh) }
  }, [fetchMyAttendance])

  const monthRecords = useMemo(() => records.filter((r) => {
    const [year, month] = r.date.slice(0, 10).split("-").map(Number)
    return year === visibleMonth.getFullYear() && month === visibleMonth.getMonth() + 1
  }), [records, visibleMonth])
  const days = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
  const offset = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay()
  const dayMap = new Map(monthRecords.map((r) => [r.date.slice(0, 10), r]))
  const chosenRecord = selectedDate ? dayMap.get(selectedDate) : undefined
  const monthTitle = visibleMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
  const changeMonth = (delta: number) => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  const recordCount = monthRecords.length
  const absentCount = monthRecords.filter((r) => !r.clockIn && r.status === "absent").length
  const presentCount = stats?.daysPresent ?? monthRecords.filter((r) => Boolean(r.clockIn) || ["present", "late", "half_day"].includes(r.status)).length
  const lateCount = stats?.lateCount ?? monthRecords.filter((r) => r.status === "late").length
  const halfDayCount = stats?.halfDayCount ?? monthRecords.filter((r) => r.status === "half_day").length
  const hours = stats?.totalHours ?? monthRecords.reduce((total, r) => total + (Number(r.hoursWorked) || 0), 0)

  return <EmployeeLayout>
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">My workspace · Attendance</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My time</h1><p className="mt-1 text-sm text-muted-foreground">Your recorded shifts and attendance history · Asia/Kolkata</p></div>
        <Button variant="outline" className="gap-2 self-start" disabled={refreshing} onClick={async () => { setRefreshing(true); await fetchMyAttendance(false); setRefreshing(false) }}><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh</Button>
      </header>

      {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button size="sm" variant="outline" onClick={() => fetchMyAttendance()}>Retry</Button></div>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Attendance summary">
        <AttendanceMetric label="Days with a punch" value={presentCount} detail="Reported this month" tone="green" icon={<CalendarDays className="h-4 w-4" />} />
        <AttendanceMetric label="Late arrivals" value={lateCount} detail="Policy-marked records" tone="amber" icon={<Clock className="h-4 w-4" />} />
        <AttendanceMetric label="Half-days" value={halfDayCount} detail="Policy-marked records" tone="orange" icon={<Clock className="h-4 w-4" />} />
        <AttendanceMetric label="Recorded hours" value={`${Number(hours).toFixed(1)}h`} detail="From attendance records" tone="blue" icon={<Clock className="h-4 w-4" />} />
        <AttendanceMetric label="Absent records" value={absentCount} detail="No punch recorded" tone="rose" icon={<CalendarDays className="h-4 w-4" />} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0"><SmartClockInOut /></div>
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base">Today’s attendance</CardTitle><CardDescription>From your latest saved record</CardDescription></div><Badge variant="outline" className="text-xs">Live state</Badge></CardHeader>
          <CardContent>
            {(() => {
              const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
              const row = records.find((r) => r.date.slice(0, 10) === today)
              if (!row) return <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No saved attendance record for today yet.</div>
              const inconsistent = Boolean(row.clockIn && row.status === "absent")
              return <div className="space-y-4"><div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Attendance state</span><AttendanceStatus status={inconsistent ? "incomplete" : row.status} /></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Clock in</p><p className="mt-1 font-semibold tabular-nums">{row.clockIn || "—"}</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Clock out</p><p className="mt-1 font-semibold tabular-nums">{row.clockOut || "—"}</p></div></div>{inconsistent && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">A punch is saved while this record says absent. This view flags the discrepancy without changing the record.</p>}<div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Recorded hours</p><p className="mt-1 text-xl font-semibold tabular-nums">{Number(row.hoursWorked || 0).toFixed(2)} h</p></div></div>
            })()}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-primary" /> Attendance history</CardTitle><CardDescription>Choose a recorded day to review saved punch details.</CardDescription></div><div className="flex items-center justify-between gap-2 sm:justify-end"><Button variant="outline" size="icon" onClick={() => { changeMonth(-1); setSelectedDate(null) }} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button><span className="min-w-32 text-center text-sm font-semibold">{monthTitle}</span><Button variant="outline" size="icon" onClick={() => { changeMonth(1); setSelectedDate(null) }} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button></div></CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading && records.length === 0 ? <div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />)}</div> : recordCount === 0 ? <div className="rounded-xl border border-dashed p-8 text-center"><CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" /><p className="text-sm font-semibold">No records for {monthTitle}</p><p className="mt-1 text-xs text-muted-foreground">Attendance dates without a saved record are left unmarked.</p></div> : <>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="pb-1 text-center text-[10px] font-semibold uppercase text-muted-foreground sm:text-xs">{day}</div>)}{Array.from({ length: offset }, (_, i) => <div key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => { const day = i + 1; const key = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; const row = dayMap.get(key); const chosen = selectedDate === key; const marked = row?.clockIn && row.status === "absent" ? "border-amber-300 bg-amber-50 text-amber-900" : row?.status === "half_day" ? "border-orange-200 bg-orange-50 text-orange-900" : row?.status === "late" ? "border-amber-200 bg-amber-50 text-amber-900" : ["leave", "on_leave"].includes(row?.status || "") ? "border-sky-200 bg-sky-50 text-sky-900" : row?.clockIn ? "border-emerald-200 bg-emerald-50 text-emerald-900" : row?.status === "absent" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-border/50 bg-muted/20 text-muted-foreground"; return <button key={key} type="button" disabled={!row} onClick={() => setSelectedDate(key)} aria-label={`${key}${row ? `: ${getStatusText(row)}` : ": no record"}`} aria-pressed={chosen} className={`relative aspect-square min-h-9 rounded-xl border text-xs font-semibold transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-12 sm:text-sm ${marked} ${chosen ? "ring-2 ring-primary" : ""} ${row ? "cursor-pointer" : "cursor-default"}`}>{day}{row && <i className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${row.is_late || row.status === "late" ? "bg-amber-500" : row.status === "half_day" ? "bg-orange-500" : row.status === "absent" ? "bg-rose-500" : "bg-emerald-500"}`} />}</button> })}</div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">{[["bg-emerald-500", "Present"], ["bg-amber-500", "Late"], ["bg-orange-500", "Half day"], ["bg-sky-500", "Leave"], ["bg-rose-500", "Absent"], ["bg-muted-foreground/40", "No record"]].map(([tone, label]) => <span key={label} className="inline-flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${tone}`} />{label}</span>)}</div>
          </>}
          {chosenRecord && <div className="mt-5 rounded-2xl border bg-muted/20 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected record</p><h3 className="mt-1 font-semibold">{new Date(`${chosenRecord.date.slice(0, 10)}T12:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" })}</h3></div><AttendanceStatus status={chosenRecord.clockIn && chosenRecord.status === "absent" ? "incomplete" : chosenRecord.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Clock in</p><p className="mt-1 text-sm font-semibold">{chosenRecord.clockIn || "—"}</p></div><div><p className="text-xs text-muted-foreground">Clock out</p><p className="mt-1 text-sm font-semibold">{chosenRecord.clockOut || "—"}</p></div><div><p className="text-xs text-muted-foreground">Recorded hours</p><p className="mt-1 text-sm font-semibold">{Number(chosenRecord.hoursWorked || 0).toFixed(2)} h</p></div><div><p className="text-xs text-muted-foreground">Location</p><p className="mt-1 break-words text-sm font-semibold">{chosenRecord.location || "—"}</p></div></div>{chosenRecord.clockIn && chosenRecord.status === "absent" && <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">Punch present with absent status; flagged for review.</p>}</div>}
        </CardContent>
      </Card>
    </div>
  </EmployeeLayout>
}
