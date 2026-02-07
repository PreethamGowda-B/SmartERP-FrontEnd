"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { useAuth } from "@/contexts/auth-context"

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

    const getToken = () => {
        if (user?.accessToken) return user.accessToken
        if (typeof window !== "undefined") {
            return localStorage.getItem("accessToken")
        }
        return null
    }

    const fetchEmployeeAttendance = async () => {
        const token = getToken()
        if (!token) return

        setLoading(true)

        try {
            const response = await fetch(
                `${BACKEND_URL}/api/attendance/employee/${userId}?month=${selectedMonth}&year=${selectedYear}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )

            if (response.ok) {
                const data = await response.json()
                setRecords(data.records || [])
                setSummary(data.summary || null)
            }
        } catch (err) {
            console.error("Error fetching employee attendance:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user && userId) {
            fetchEmployeeAttendance()
        }
    }, [user, userId, selectedMonth, selectedYear])

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return "—"
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
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
                        <p className="text-muted-foreground">Detailed attendance records</p>
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
                                    className="w-full p-2 border rounded-md"
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
                                    className="w-full p-2 border rounded-md"
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
                                <div className="text-2xl font-bold">{summary.total_hours.toFixed(1)}</div>
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

                {/* Attendance Records */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Attendance Records - {months[selectedMonth - 1]} {selectedYear}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-center text-muted-foreground py-8">Loading...</p>
                        ) : records.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No attendance records for this period
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {records.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[60px]">
                                                <p className="text-2xl font-bold">{new Date(record.date).getDate()}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(record.date).toLocaleDateString("en-US", { weekday: "short" })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-medium">{formatDate(record.date)}</p>
                                                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        In: {formatTime(record.check_in_time)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Out: {formatTime(record.check_out_time)}
                                                    </span>
                                                </div>
                                                {record.notes && (
                                                    <p className="text-xs text-muted-foreground mt-1">Note: {record.notes}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Hours</p>
                                                <p className="font-semibold">
                                                    {record.working_hours ? `${record.working_hours} hrs` : "—"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {getStatusBadge(record.status)}
                                                {record.is_late && (
                                                    <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">
                                                        Late
                                                    </Badge>
                                                )}
                                                {record.is_manual && (
                                                    <Badge variant="outline" className="text-blue-500 border-blue-500 text-xs">
                                                        Manual
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </OwnerLayout>
    )
}
