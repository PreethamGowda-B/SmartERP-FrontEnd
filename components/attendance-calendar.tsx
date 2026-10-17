"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarDays, Clock } from "lucide-react"
import { AttendanceStatus } from "@/components/attendance/attendance-ui"

export interface AttendanceRecord {
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

interface AttendanceCalendarProps {
  records: AttendanceRecord[]
  month: number
  year: number
  onDayClick?: (day: AttendanceRecord) => void
}

interface DayDetailProps { day: AttendanceRecord; onClose: () => void }

const dateKey = (date: string) => date.slice(0, 10)

export function AttendanceCalendar({ records, month, year, onDayClick }: AttendanceCalendarProps) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const byDate = new Map(records.map((record) => [dateKey(record.date), record]))
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const stateLabel = (r: AttendanceRecord | undefined) => !r ? "No record" : r.check_in_time && r.status === "absent" ? "Clocked in · review status" : r.is_late ? "Late" : r.status || (r.check_in_time ? "Present" : "Absent")
  const tone = (record: AttendanceRecord | undefined) => {
    if (!record) return "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40"
    if (record.check_in_time && record.status === "absent") return "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
    const status = record.is_late ? "late" : record.status
    return status === "present" ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
      : status === "late" ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
      : status === "half_day" ? "border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200"
      : ["leave", "on_leave"].includes(status || "") ? "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
      : "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
  }

  return <div className="space-y-4">
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">{day}</div>)}
      {cells.map((day, index) => {
        if (day === null) return <div key={`empty-${index}`} aria-hidden="true" className="aspect-square" />
        const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        const record = byDate.get(key)
        return <button key={key} type="button" onClick={() => record && onDayClick?.(record)} disabled={!record} aria-label={`${key}: ${stateLabel(record)}`} title={stateLabel(record)} className={`group relative flex aspect-square min-h-9 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-12 sm:text-sm ${tone(record)} ${record ? "cursor-pointer" : "cursor-default"}`}>
          <span>{day}</span>{record && <span aria-hidden="true" className={`mt-1 h-1.5 w-1.5 rounded-full ${record.is_late ? "bg-amber-500" : record.status === "half_day" ? "bg-orange-500" : ["leave", "on_leave"].includes(record.status || "") ? "bg-sky-500" : record.check_in_time ? "bg-emerald-500" : "bg-rose-500"}`} />}
        </button>
      })}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
      {[["bg-emerald-500", "Present"], ["bg-amber-500", "Late"], ["bg-orange-500", "Half day"], ["bg-sky-500", "Leave"], ["bg-rose-500", "Absent"], ["bg-muted-foreground/40", "No record"]].map(([color, label]) => <span key={label} className="inline-flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span>)}
    </div>
  </div>
}

export function DayDetail({ day, onClose }: DayDetailProps) {
  const formatTime = (value: string | null) => value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—"
  const title = new Date(`${dateKey(day.date)}T12:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" })
  const clockedButAbsent = Boolean(day.check_in_time && day.status === "absent")
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-md rounded-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />{title}</DialogTitle></DialogHeader>
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2"><AttendanceStatus status={clockedButAbsent ? "incomplete" : day.is_late ? "late" : day.status} />{day.is_late && <Badge variant="outline">Late arrival</Badge>}{day.is_manual && <Badge variant="outline">Manual entry</Badge>}{day.is_auto_clocked_out && <Badge variant="outline">Auto clock-out</Badge>}</div>
      {clockedButAbsent && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">A punch is recorded while the attendance status is absent. This display flags the mismatch without changing the saved record.</p>}
      <div className="grid grid-cols-2 gap-3"><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Clock in</p><p className="mt-1 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-primary" />{formatTime(day.check_in_time)}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Clock out</p><p className="mt-1 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-primary" />{formatTime(day.check_out_time)}</p></div></div>
      <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Recorded hours</p><p className="mt-1 text-xl font-semibold tabular-nums">{day.working_hours != null ? `${Number(day.working_hours).toFixed(2)} h` : "—"}</p></div>
      {day.notes && <div><p className="text-xs font-medium text-muted-foreground">Notes</p><p className="mt-1 whitespace-pre-wrap text-sm">{day.notes}</p></div>}
    </div>
  </DialogContent></Dialog>
}
