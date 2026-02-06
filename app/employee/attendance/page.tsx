"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, LogIn, LogOut, Calendar, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
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
}

export default function AttendancePage() {
    const { user } = useAuth()
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
    const [history, setHistory] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const getToken = () => {
        if (user?.accessToken) return user.accessToken
        if (typeof window !== "undefined") {
            return localStorage.getItem("accessToken")
        }
        return null
    }

    // Fetch today's attendance
    const fetchTodayAttendance = async () => {
        const token = getToken()
        if (!token) return

        try {
            const response = await fetch(`${BACKEND_URL}/api/attendance/today`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                const data = await response.json()
                setTodayAttendance(data)
            }
        } catch (err) {
            console.error("Error fetching today's attendance:", err)
        }
    }

    // Fetch attendance history
    const fetchHistory = async () => {
        const token = getToken()
        if (!token) return

        try {
            const currentMonth = new Date().getMonth() + 1
            const currentYear = new Date().getFullYear()

            const response = await fetch(
                `${BACKEND_URL}/api/attendance/history?month=${currentMonth}&year=${currentYear}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )

            if (response.ok) {
                const data = await response.json()
                setHistory(data)
            }
        } catch (err) {
            console.error("Error fetching history:", err)
        }
    }

    useEffect(() => {
        if (user) {
            fetchTodayAttendance()
            fetchHistory()
        }
    }, [user])

    const handleCheckIn = async () => {
        const token = getToken()
        if (!token) return

        setLoading(true)
        setError("")

        try {
            const response = await fetch(`${BACKEND_URL}/api/attendance/check-in`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await response.json()

            if (response.ok) {
                setTodayAttendance(data)
                fetchHistory()
            } else {
                setError(data.message || "Failed to check in")
            }
        } catch (err) {
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleCheckOut = async () => {
        const token = getToken()
        if (!token) return

        setLoading(true)
        setError("")

        try {
            const response = await fetch(`${BACKEND_URL}/api/attendance/check-out`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await response.json()

            if (response.ok) {
                setTodayAttendance(data)
                fetchHistory()
            } else {
                setError(data.message || "Failed to check out")
            }
        } catch (err) {
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return "Not recorded"
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
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
            case "late":
                return (
                    <Badge className="bg-orange-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Late
                    </Badge>
                )
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const canCheckIn = !todayAttendance?.check_in_time
    const canCheckOut = todayAttendance?.check_in_time && !todayAttendance?.check_out_time

    return (
        <EmployeeLayout>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Attendance</h1>
                    <p className="text-muted-foreground">Track your daily attendance</p>
                </div>

                {error && (
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Today's Attendance Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Today's Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Check-in/Check-out Buttons */}
                        <div className="flex gap-4">
                            <Button
                                onClick={handleCheckIn}
                                disabled={!canCheckIn || loading}
                                className="flex-1"
                                size="lg"
                            >
                                <LogIn className="h-5 w-5 mr-2" />
                                Check In
                            </Button>
                            <Button
                                onClick={handleCheckOut}
                                disabled={!canCheckOut || loading}
                                variant="outline"
                                className="flex-1"
                                size="lg"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Check Out
                            </Button>
                        </div>

                        {/* Today's Status */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Check In</p>
                                <p className="text-lg font-semibold">{formatTime(todayAttendance?.check_in_time || null)}</p>
                                {todayAttendance?.is_late && (
                                    <Badge variant="destructive" className="text-xs">
                                        Late
                                    </Badge>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Check Out</p>
                                <p className="text-lg font-semibold">{formatTime(todayAttendance?.check_out_time || null)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Working Hours</p>
                                <p className="text-lg font-semibold">
                                    {todayAttendance?.working_hours ? `${todayAttendance.working_hours} hrs` : "—"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div>{getStatusBadge(todayAttendance?.status || null)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance History */}
                <Card>
                    <CardHeader>
                        <CardTitle>This Month's Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No attendance records for this month</p>
                        ) : (
                            <div className="space-y-2">
                                {history.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold">{new Date(record.date).getDate()}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(record.date).toLocaleDateString("en-US", { month: "short" })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-medium">{formatDate(record.date)}</p>
                                                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                                    <span>In: {formatTime(record.check_in_time)}</span>
                                                    <span>Out: {formatTime(record.check_out_time)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-semibold">
                                                    {record.working_hours ? `${record.working_hours} hrs` : "—"}
                                                </p>
                                                {record.is_late && (
                                                    <p className="text-xs text-destructive">Late</p>
                                                )}
                                            </div>
                                            {getStatusBadge(record.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </EmployeeLayout>
    )
}
