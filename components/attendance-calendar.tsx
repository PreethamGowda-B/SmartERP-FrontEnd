"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, X } from "lucide-react"

// Backend-aligned AttendanceRecord interface (snake_case)
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

interface AttendanceCalendarProps {
  records: AttendanceRecord[]
  month: number
  year: number
  onDayClick?: (day: AttendanceRecord) => void
}

interface DayDetailProps {
  day: AttendanceRecord
  onClose: () => void
}

export function AttendanceCalendar({ records, month, year, onDayClick }: AttendanceCalendarProps) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

  const getRecordForDay = (day: number): AttendanceRecord | null => {
    return records.find((record) => {
      const recordDate = new Date(record.date)
      return recordDate.getDate() === day && recordDate.getMonth() === month - 1 && recordDate.getFullYear() === year
    }) || null
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "present":
        return "bg-green-500 hover:bg-green-600"
      case "half_day":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "absent":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-200 hover:bg-gray-300"
    }
  }

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const record = getRecordForDay(day)
    const statusColor = record ? getStatusColor(record.status) : "bg-gray-100 hover:bg-gray-200"

    days.push(
      <button
        key={day}
        onClick={() => record && onDayClick?.(record)}
        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors ${statusColor} ${record ? "cursor-pointer" : "cursor-default"}`}
        disabled={!record}
      >
        <span className={record ? "text-white" : "text-gray-600"}>{day}</span>
        {record?.is_late && <span className="text-xs text-orange-200">Late</span>}
      </button>
    )
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days}
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Half Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Absent</span>
        </div>
      </div>
    </div>
  )
}

export function DayDetail({ day, onClose }: DayDetailProps) {
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formatDate(day.date)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {getStatusBadge(day.status)}
            {day.is_late && (
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                Late
              </Badge>
            )}
            {day.is_manual && (
              <Badge variant="outline" className="text-blue-500 border-blue-500">
                Manual
              </Badge>
            )}
          </div>

          {day.status !== "absent" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Clock In</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(day.check_in_time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clock Out</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(day.check_out_time)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Hours Worked</p>
                <p className="font-medium">{day.working_hours ? `${day.working_hours} hours` : "—"}</p>
              </div>

              {day.is_auto_clocked_out && (
                <p className="text-xs text-muted-foreground">Auto clocked out at 7 PM</p>
              )}
            </>
          )}

          {day.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{day.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
