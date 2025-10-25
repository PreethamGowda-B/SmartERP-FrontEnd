"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: Date
  clockInTime: Date | null
  clockOutTime: Date | null
  hoursWorked: number
  status: "present" | "absent" | "on-leave"
}

interface AttendanceContextType {
  records: AttendanceRecord[]
  clockIn: () => void
  clockOut: () => void
  getTodayRecord: () => AttendanceRecord | undefined
  getEmployeeRecords: (employeeId: string) => AttendanceRecord[]
  isLoading: boolean
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined)

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize with mock data
  useEffect(() => {
    if (user) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if today's record exists
      const todayRecord = records.find((r) => {
        const recordDate = new Date(r.date)
        recordDate.setHours(0, 0, 0, 0)
        return recordDate.getTime() === today.getTime() && r.employeeId === user.id
      })

      if (!todayRecord) {
        // Create today's record if it doesn't exist
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId: user.id,
          employeeName: user.name,
          date: today,
          clockInTime: null,
          clockOutTime: null,
          hoursWorked: 0,
          status: "absent",
        }
        setRecords((prev) => [...prev, newRecord])
      }
    }
  }, [user])

  const calculateHoursWorked = (clockIn: Date, clockOut: Date): number => {
    const diff = clockOut.getTime() - clockIn.getTime()
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimals
  }

  const clockIn = () => {
    if (!user) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    setRecords((prev) =>
      prev.map((record) => {
        const recordDate = new Date(record.date)
        recordDate.setHours(0, 0, 0, 0)

        if (recordDate.getTime() === today.getTime() && record.employeeId === user.id && !record.clockInTime) {
          return {
            ...record,
            clockInTime: new Date(),
            status: "present",
          }
        }
        return record
      }),
    )

    // Persist to backend
    ;(async () => {
      try {
        // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/clock-in`, {
        //   method: 'POST',
        //   body: JSON.stringify({ employeeId: user.id }),
        //   credentials: 'include'
        // })
      } catch (error) {
        console.log("[v0] Failed to sync clock-in to backend")
      }
    })()
  }

  const clockOut = () => {
    if (!user) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    setRecords((prev) =>
      prev.map((record) => {
        const recordDate = new Date(record.date)
        recordDate.setHours(0, 0, 0, 0)

        if (
          recordDate.getTime() === today.getTime() &&
          record.employeeId === user.id &&
          record.clockInTime &&
          !record.clockOutTime
        ) {
          const clockOutTime = new Date()
          const hoursWorked = calculateHoursWorked(record.clockInTime, clockOutTime)

          return {
            ...record,
            clockOutTime,
            hoursWorked,
          }
        }
        return record
      }),
    )

    // Persist to backend
    ;(async () => {
      try {
        // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/clock-out`, {
        //   method: 'POST',
        //   body: JSON.stringify({ employeeId: user.id }),
        //   credentials: 'include'
        // })
      } catch (error) {
        console.log("[v0] Failed to sync clock-out to backend")
      }
    })()
  }

  const getTodayRecord = () => {
    if (!user) return undefined

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return records.find((r) => {
      const recordDate = new Date(r.date)
      recordDate.setHours(0, 0, 0, 0)
      return recordDate.getTime() === today.getTime() && r.employeeId === user.id
    })
  }

  const getEmployeeRecords = (employeeId: string) => {
    return records.filter((r) => r.employeeId === employeeId)
  }

  return (
    <AttendanceContext.Provider
      value={{
        records,
        clockIn,
        clockOut,
        getTodayRecord,
        getEmployeeRecords,
        isLoading,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  )
}

export function useAttendance() {
  const context = useContext(AttendanceContext)
  if (!context) {
    throw new Error("useAttendance must be used within AttendanceProvider")
  }
  return context
}
