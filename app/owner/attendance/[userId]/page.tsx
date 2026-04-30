"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, List, CalendarDays } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { useAuth } from "@/contexts/auth-context"
import { AttendanceCalendar, DayDetail } from "@/components/attendance-calendar"
import { apiClient, getAuthToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { cn } from "@/lib/utils"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

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

interface AttendanceSummary {
    total_days: number
    present_days: number
    absent_days: number
    half_days: number
    total_hours: number
    late_days: number
}

export default function EmployeeAttendanceDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const userId = params.userId as string

    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [summary, setSummary] = useState<AttendanceSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
    const [selectedDay, setSelectedDay] = useState<AttendanceRecord | null>(null)

    const fetchEmployeeAttendance = useCallback(async () => {
        setLoading(true)
        try {
            const data = await apiClient(`/api/attendance/employee/${userId}?month=${selectedMonth}&year=${selectedYear}`)
            setRecords(Array.isArray(data.records) ? data.records : [])
            setSummary(data.summary || null)
        } catch (err: any) {
            logger.error("Error fetching employee attendance:", err)
        } finally {
            setLoading(false)
        }
    }, [userId, selectedMonth, selectedYear])

    useEffect(() => {
        if (user && userId) {
            fetchEmployeeAttendance()
        }
    }, [user, userId, selectedMonth, selectedYear, fetchEmployeeAttendance])

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return "—"
        return new Date(timestamp).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const getStatusBadge = (status: string | null) => {
        if (!status) return <Badge variant="secondary">Pending</Badge>

        switch (status) {
            case "present":
                return (
                    <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Present
                    </Badge>
                )
            case "half_day":
                return (
                    <Badge className="bg-yellow-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Half Day
                    </Badge>
                )
            case "absent":
                return (
                    <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Absent
                    </Badge>
                )
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    return (
        <OwnerLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Employee Attendance</h1>
                        <p className="text-muted-foreground">Detailed attendance records and calendar view</p>
                    </div>
                </div>

                {/* Month/Year Selector */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="w-full p-2 border rounded-md bg-background"
                                >
                                    {months.map((month, index) => (
                                        <option key={index} value={index + 1}>
                                            {month}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full p-2 border rounded-md bg-background"
                                >
                                    {[2024, 2025, 2026, 2027].map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Days</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.total_days}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-500">{summary.present_days}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">{summary.absent_days}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Half Days</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-500">{summary.half_days}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black tracking-tight">{Number(summary.total_hours || 0).toFixed(1)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Late Days</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-500">{summary.late_days}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Attendance Records with View Toggle */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Attendance Records - {months[selectedMonth - 1]} {selectedYear}
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4 mr-2" />
                                    List
                                </Button>
                                <Button
                                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('calendar')}
                                >
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    Calendar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <SkeletonList count={5} />
                        ) : viewMode === 'calendar' ? (
                            <AttendanceCalendar
                                records={records}
                                month={selectedMonth}
                                year={selectedYear}
                                onDayClick={(day) => setSelectedDay(day)}
                            />
                        ) : (Array.isArray(records) && records.length === 0) ? (
                            <div className="text-center py-16 bg-gray-50/50 rounded-xl border border-dashed">
                                <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                <p className="text-sm font-bold text-muted-foreground">No attendance records for this period</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Array.isArray(records) && records.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-accent/50 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[60px]">
                                                <p className="text-2xl font-black tracking-tighter">{new Date(record.date).getDate()}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                    {new Date(record.date).toLocaleDateString("en-IN", { weekday: "short" })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{formatDate(record.date)}</p>
                                                <div className="flex gap-4 text-xs font-medium text-muted-foreground/70 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        In: {formatTime(record.check_in_time)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Out: {formatTime(record.check_out_time)}
                                                    </span>
                                                </div>
                                                {record.is_auto_clocked_out && (
                                                    <p className="text-[10px] font-bold text-orange-600/70 mt-1 uppercase tracking-tighter">Auto clocked out @ 7 PM</p>
                                                )}
                                                {record.notes && (
                                                    <p className="text-[10px] font-bold text-muted-foreground/50 mt-1">Note: {record.notes}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Hours</p>
                                                <p className="font-black tracking-tighter text-lg">
                                                    {record.working_hours ? `${Number(record.working_hours || 0).toFixed(1)}h` : "—"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1 items-end">
                                                {getStatusBadge(record.status)}
                                                <div className="flex gap-1 flex-wrap justify-end">
                                                    {record.is_late && (
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter text-orange-500 border-orange-500/30">
                                                            Late
                                                        </Badge>
                                                    )}
                                                    {record.is_manual && (
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter text-blue-500 border-blue-500/30">
                                                            Manual
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Day Detail Modal */}
            {selectedDay && (
                <DayDetail
                    day={selectedDay}
                    onClose={() => setSelectedDay(null)}
                />
            )}
        </OwnerLayout>
    )
}
