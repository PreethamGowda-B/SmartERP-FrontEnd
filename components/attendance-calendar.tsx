"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AttendanceRecord } from "@/lib/data"
import { format, isSameDay } from "date-fns"

interface AttendanceCalendarProps {
  records: AttendanceRecord[]
  employeeId?: string
}

export function AttendanceCalendar({ records, employeeId }: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const filteredRecords = employeeId ? records.filter((record) => record.employeeId === employeeId) : records

  const getRecordForDate = (date: Date) => {
    return filteredRecords.find((record) => isSameDay(new Date(record.date), date))
  }

  const getDayStatus = (date: Date) => {
    const record = getRecordForDate(date)
    if (!record) return null
    return record.status
  }

  const selectedRecord = selectedDate ? getRecordForDate(selectedDate) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
          <CardDescription>Click on a date to view attendance details</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              present: (date) => getDayStatus(date) === "present",
              late: (date) => getDayStatus(date) === "late",
              absent: (date) => getDayStatus(date) === "absent",
            }}
            modifiersStyles={{
              present: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" },
              late: { backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" },
              absent: { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" },
            }}
          />
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
              <span>Absent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select a Date"}</CardTitle>
          <CardDescription>Attendance details for selected date</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedRecord.status === "present"
                      ? "default"
                      : selectedRecord.status === "late"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {selectedRecord.status}
                </Badge>
              </div>

              {selectedRecord.status !== "absent" && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Clock In</p>
                      <p className="font-medium">{selectedRecord.clockIn}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clock Out</p>
                      <p className="font-medium">{selectedRecord.clockOut || "Still working"}</p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="text-muted-foreground">Hours Worked</p>
                    <p className="font-medium">{selectedRecord.hoursWorked}h</p>
                  </div>

                  <div className="text-sm">
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedRecord.location}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              {selectedDate ? "No attendance record for this date" : "Select a date to view details"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
