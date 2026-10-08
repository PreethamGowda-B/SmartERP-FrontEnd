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

// Dynamic attendance data - populated from backend
export const generateMockAttendance = (_days = 30): AttendanceRecord[] => []

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
