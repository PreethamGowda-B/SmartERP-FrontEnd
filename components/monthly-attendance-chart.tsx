"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Calendar } from "lucide-react"

interface AttendanceSummary {
  totalPresents: number
  totalLates: number
  totalAbsents: number
  totalHolidays: number
  workingDays: number
}

interface MonthlyAttendanceChartProps {
  data?: AttendanceSummary
}

export function MonthlyAttendanceChart({ data }: MonthlyAttendanceChartProps) {
  // Mock data if not provided
  const summary = data || {
    totalPresents: 18,
    totalLates: 2,
    totalAbsents: 1,
    totalHolidays: 4,
    workingDays: 22,
  }

  const chartData = [
    { name: "Present", value: summary.totalPresents, color: "#22c55e" },
    { name: "Late", value: summary.totalLates, color: "#f59e0b" },
    { name: "Absent", value: summary.totalAbsents, color: "#ef4444" },
    { name: "Holidays", value: summary.totalHolidays, color: "#3b82f6" },
  ]

  const attendanceRate = Math.round(
    ((summary.totalPresents + summary.totalLates) / (summary.workingDays - summary.totalHolidays)) * 100,
  )

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-accent" />
          Monthly Attendance Summary
        </CardTitle>
        <CardDescription>Overview of this month&apos;s attendance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-muted-foreground">Present</p>
            <p className="text-2xl font-bold text-green-600">{summary.totalPresents}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-muted-foreground">Late</p>
            <p className="text-2xl font-bold text-orange-600">{summary.totalLates}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold text-red-600">{summary.totalAbsents}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-muted-foreground">Holidays</p>
            <p className="text-2xl font-bold text-blue-600">{summary.totalHolidays}</p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold text-accent">{attendanceRate}%</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{summary.totalPresents + summary.totalLates} present days</p>
              <p>out of {summary.workingDays - summary.totalHolidays} working days</p>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
