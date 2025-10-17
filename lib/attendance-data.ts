// Extended attendance data and utilities
import { type AttendanceRecord, mockEmployees } from "./data"

export interface AttendanceStats {
  totalHours: number
  regularHours: number
  overtimeHours: number
  daysPresent: number
  daysAbsent: number
  averageHoursPerDay: number
}

export interface LocationData {
  latitude: number
  longitude: number
  address: string
  timestamp: string
}

// Generate more comprehensive mock attendance data
export const generateMockAttendance = (days = 30): AttendanceRecord[] => {
  const records: AttendanceRecord[] = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue

    mockEmployees.forEach((employee) => {
      // 90% attendance rate
      if (Math.random() > 0.1) {
        const clockIn = new Date(date)
        clockIn.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60))

        const clockOut = new Date(clockIn)
        clockOut.setHours(clockIn.getHours() + 8 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60))

        const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

        records.push({
          id: `${employee.id}-${date.toISOString().split("T")[0]}`,
          employeeId: employee.id,
          date: date.toISOString().split("T")[0],
          clockIn: clockIn.toTimeString().slice(0, 5),
          clockOut: clockOut.toTimeString().slice(0, 5),
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          location: "Downtown Office Complex",
          jobId: "1",
          status: clockIn.getHours() > 8 ? "late" : "present",
        })
      } else {
        records.push({
          id: `${employee.id}-${date.toISOString().split("T")[0]}`,
          employeeId: employee.id,
          date: date.toISOString().split("T")[0],
          clockIn: "",
          hoursWorked: 0,
          location: "",
          status: "absent",
        })
      }
    })
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const calculateAttendanceStats = (records: AttendanceRecord[]): AttendanceStats => {
  const totalHours = records.reduce((sum, record) => sum + record.hoursWorked, 0)
  const regularHours = records.reduce((sum, record) => sum + Math.min(record.hoursWorked, 8), 0)
  const overtimeHours = records.reduce((sum, record) => sum + Math.max(record.hoursWorked - 8, 0), 0)
  const daysPresent = records.filter((record) => record.status === "present" || record.status === "late").length
  const daysAbsent = records.filter((record) => record.status === "absent").length
  const averageHoursPerDay = daysPresent > 0 ? totalHours / daysPresent : 0

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    daysPresent,
    daysAbsent,
    averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
  }
}

export const mockAttendanceRecords = generateMockAttendance(30)
