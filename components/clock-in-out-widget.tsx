"use client"

import { useState, useEffect } from "react"
import { useAttendance } from "@/contexts/attendance-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, LogIn, LogOut } from "lucide-react"

export function ClockInOutWidget() {
  const { clockIn, clockOut, getTodayRecord } = useAttendance()
  const [currentTime, setCurrentTime] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  const todayRecord = getTodayRecord()

  useEffect(() => {
    setMounted(true)

    const updateTime = () => {
      const now = new Date()
      const hours12 = now.getHours() % 12 || 12
      const minutes = String(now.getMinutes()).padStart(2, "0")
      const seconds = String(now.getSeconds()).padStart(2, "0")
      const ampm = now.getHours() >= 12 ? "PM" : "AM"
      setCurrentTime(`${hours12}:${minutes}:${seconds} ${ampm}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const formatTime = (date: Date | null) => {
    if (!date) return "Not clocked in"
    const hours12 = date.getHours() % 12 || 12
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const ampm = date.getHours() >= 12 ? "PM" : "AM"
    return `${hours12}:${minutes} ${ampm}`
  }

  const isClockedIn = todayRecord?.clockInTime && !todayRecord?.clockOutTime
  const isClockedOut = todayRecord?.clockOutTime

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">{currentTime}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {todayRecord?.status === "absent"
              ? "Not clocked in"
              : todayRecord?.status === "present"
                ? "Clocked In"
                : "Clocked Out"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-background/50 p-3 rounded-lg">
            <div className="text-muted-foreground">Clock In</div>
            <div className="font-semibold">{formatTime(todayRecord?.clockInTime || null)}</div>
          </div>
          <div className="bg-background/50 p-3 rounded-lg">
            <div className="text-muted-foreground">Clock Out</div>
            <div className="font-semibold">{formatTime(todayRecord?.clockOutTime || null)}</div>
          </div>
        </div>

        {todayRecord?.hoursWorked > 0 && (
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-700 dark:text-green-300">Hours Worked Today</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{todayRecord.hoursWorked} hrs</div>
          </div>
        )}

        {todayRecord?.status === "absent" && (
          <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-300">Status: Absent</div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={clockIn}
            disabled={isClockedIn || isClockedOut}
            className="flex-1 gap-2"
            variant={isClockedIn ? "secondary" : "default"}
          >
            <LogIn className="h-4 w-4" />
            Clock In
          </Button>
          <Button
            onClick={clockOut}
            disabled={!isClockedIn}
            className="flex-1 gap-2"
            variant={isClockedOut ? "secondary" : "destructive"}
          >
            <LogOut className="h-4 w-4" />
            Clock Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
