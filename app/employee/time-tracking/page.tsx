"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, LogIn, LogOut, Calendar, AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
import { useAuth } from "@/contexts/auth-context"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

import { apiClient, getAuthToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { ErrorView } from "@/components/ui/error-view"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { cn } from "@/lib/utils"

function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

interface AttendanceRecord {
    id: number
    date: string
    check_in_time: string | null
    check_out_time: string | null
    working_hours: number | null
    status: string | null
    is_late: boolean
    is_auto_clocked_out?: boolean
}

export default function TimeTrackingPage() {
    const { user } = useAuth()
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
    const [history, setHistory] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [currentTime, setCurrentTime] = useState(new Date())

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Fetch today's attendance
    const fetchTodayAttendance = useCallback(async () => {
        try {
            const data = await apiClient("/api/attendance/today")
            setTodayAttendance(data)
        } catch (err: any) {
            logger.error("Error fetching today's attendance:", err)
        }
    }, [])

    // Fetch attendance history
    const fetchHistory = useCallback(async () => {
        try {
            const currentMonth = new Date().getMonth() + 1
            const currentYear = new Date().getFullYear()

            const data = await apiClient(`/api/attendance/history?month=${currentMonth}&year=${currentYear}`)
            setHistory(Array.isArray(data) ? data : [])
        } catch (err: any) {
            logger.error("Error fetching history:", err)
            setError("Failed to load attendance records")
        }
    }, [])

    useEffect(() => {
        if (user) {
            fetchTodayAttendance()
            fetchHistory()
        }
    }, [user])

    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
    const [pendingSync, setPendingSync] = useState(false)

    const syncOfflineData = useCallback(async () => {
        const { getPendingAttendance, deletePendingAttendance } = await import('@/lib/db')
        const pending = await getPendingAttendance()
        
        if (pending.length === 0) return
        
        setPendingSync(true)
        let successCount = 0

        for (const action of pending) {
            try {
                const endpoint = action.type === 'clock-in' ? '/api/attendance/clock-in' : '/api/attendance/clock-out'
                await apiClient(endpoint, { method: 'POST' })
                await deletePendingAttendance(action.id!)
                successCount++
            } catch (err) {
                console.error('Failed to sync action:', action, err)
            }
        }

        if (successCount > 0) {
            fetchTodayAttendance()
            fetchHistory()
        }
        setPendingSync(false)
    }, [fetchTodayAttendance, fetchHistory])

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            syncOfflineData()
        }
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Initial sync check
        syncOfflineData()

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [syncOfflineData])

    const handleClockIn = async () => {
        setLoading(true)
        setError("")

        if (!navigator.onLine) {
            const { savePendingAttendance } = await import('@/lib/db')
            await savePendingAttendance({
                type: 'clock-in',
                timestamp: new Date().toISOString(),
                status: 'pending'
            })
            setTodayAttendance({
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                check_in_time: new Date().toISOString(),
                check_out_time: null,
                working_hours: null,
                status: 'pending',
                is_late: false
            })
            setLoading(false)
            return
        }

        try {
            const data = await apiClient("/api/attendance/clock-in", { method: "POST" })
            setTodayAttendance(data)
            fetchHistory()
        } catch (err: any) {
            setError(err.message || "Failed to clock in")
        } finally {
            setLoading(false)
        }
    }

    const handleClockOut = async () => {
        setLoading(true)
        setError("")

        if (!navigator.onLine) {
            const { savePendingAttendance } = await import('@/lib/db')
            await savePendingAttendance({
                type: 'clock-out',
                timestamp: new Date().toISOString(),
                status: 'pending'
            })
            setTodayAttendance(prev => prev ? {
                ...prev,
                check_out_time: new Date().toISOString(),
                status: 'pending'
            } : null)
            setLoading(false)
            return
        }

        try {
            const data = await apiClient("/api/attendance/clock-out", { method: "POST" })
            setTodayAttendance(data)
            fetchHistory()
        } catch (err: any) {
            setError(err.message || "Failed to clock out")
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

    const canClockIn = !todayAttendance?.check_in_time
    const canClockOut = todayAttendance?.check_in_time && !todayAttendance?.check_out_time

    return (
        <EmployeeLayout>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Time Tracking</h1>
                    <p className="text-muted-foreground">Clock in and out to track your working hours</p>
                </div>

                {/* Shift Info Banner */}
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium text-blue-900 dark:text-blue-100">Shift Hours: 9:00 AM - 7:00 PM</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    • Clock in by 9:00 AM to avoid late mark<br />
                                    • Clock out before 7:00 PM will be marked as half day<br />
                                    • System auto clocks out at 7:00 PM if you forget
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-blue-600 dark:text-blue-400">Current Time</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                    {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {!isOnline && (
                    <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-amber-900 dark:text-amber-100">
                                <AlertCircle className="h-5 w-5" />
                                <p className="font-medium text-sm">Offline Mode: Actions will be saved locally and sync when back online.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                            Today's Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Clock-in/Clock-out Buttons */}
                        <div className="flex gap-4">
                            <Button
                                onClick={handleClockIn}
                                disabled={!canClockIn || loading}
                                className="flex-1"
                                size="lg"
                            >
                                <LogIn className="h-5 w-5 mr-2" />
                                Clock In
                            </Button>
                            <Button
                                onClick={handleClockOut}
                                disabled={!canClockOut || loading}
                                variant="outline"
                                className="flex-1"
                                size="lg"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Clock Out
                            </Button>
                        </div>

                        {/* Today's Status */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Clock In</p>
                                <p className="text-lg font-semibold">{formatTime(todayAttendance?.check_in_time || null)}</p>
                                {todayAttendance?.is_late && (
                                    <Badge variant="destructive" className="text-xs">
                                        Late (After 9 AM)
                                    </Badge>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Clock Out</p>
                                <p className="text-lg font-semibold">{formatTime(todayAttendance?.check_out_time || null)}</p>
                                {todayAttendance?.is_auto_clocked_out && (
                                    <Badge variant="outline" className="text-xs">
                                        Auto (7 PM)
                                    </Badge>
                                )}
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
                        {loading && history.length === 0 ? (
                            <SkeletonList count={4} />
                        ) : error && history.length === 0 ? (
                            <ErrorView title="Records Unavailable" message={error} onRetry={fetchHistory} />
                        ) : (Array.isArray(history) && history.length === 0) ? (
                            <p className="text-center text-muted-foreground py-8 font-medium">No attendance records for this month</p>
                        ) : (
                            <div className="space-y-2">
                                {Array.isArray(history) && history.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-center w-12">
                                                <p className="text-2xl font-black tracking-tight">{new Date(record.date).getDate()}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                    {new Date(record.date).toLocaleDateString("en-US", { month: "short" })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{formatDate(record.date)}</p>
                                                <div className="flex gap-4 text-xs font-medium text-muted-foreground/70 mt-1">
                                                    <span>In: {formatTime(record.check_in_time)}</span>
                                                    <span>Out: {formatTime(record.check_out_time)}</span>
                                                </div>
                                                {record.is_auto_clocked_out && (
                                                    <p className="text-[10px] font-bold text-orange-600/70 mt-1 uppercase tracking-tighter">Auto clocked out @ 7 PM</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-black tracking-tighter text-lg">
                                                    {record.working_hours ? `${Number(record.working_hours || 0).toFixed(1)}h` : "—"}
                                                </p>
                                                {record.is_late && (
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">Late</p>
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
