"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Clock, CheckCircle2, XCircle, Timer, Download,
    Loader2, AlertCircle, ClipboardList, BarChart3
} from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"

const API = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"

function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

async function fetchReport(endpoint: string, period: string) {
    const res = await fetch(`${API}/api/reports/${endpoint}?period=${period}`, {
        credentials: "include",
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`)
    return res.json()
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }: any) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${color}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold">{value ?? "—"}</p>
                        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        present: "bg-green-100 text-green-800",
        absent: "bg-red-100 text-red-800",
        half_day: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        pending: "bg-yellow-100 text-yellow-800",
        in_progress: "bg-blue-100 text-blue-800",
        open: "bg-blue-100 text-blue-800",
        declined: "bg-red-100 text-red-800",
    }
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
            {status?.replace(/_/g, " ")}
        </span>
    )
}

function fmt(dateStr: string | null) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString()
}

function fmtTime(dateStr: string | null) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function EmployeeReportsPage() {
    const [period, setPeriod] = useState("month")
    const [activeTab, setActiveTab] = useState("attendance")

    const [attendance, setAttendance] = useState<any>(null)
    const [jobs, setJobs] = useState<any>(null)
    const [materials, setMaterials] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const loadAll = useCallback(async (p: string) => {
        setLoading(true)
        setError("")
        try {
            const [att, job, mat] = await Promise.all([
                fetchReport("my-attendance", p),
                fetchReport("my-jobs", p),
                fetchReport("my-materials", p),
            ])
            setAttendance(att)
            setJobs(job)
            setMaterials(mat)
        } catch (e: any) {
            setError(e.message || "Failed to load report data")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadAll(period) }, [period, loadAll])

    const handleExport = () => {
        if (!attendance || !jobs || !materials) return
        const lines = [
            `My SmartERP Report — ${period.toUpperCase()} — ${new Date().toLocaleString()}`,
            "=".repeat(60),
            "",
            "MY ATTENDANCE",
            `  Days present:  ${attendance.summary?.days_present ?? 0}`,
            `  Days absent:   ${attendance.summary?.days_absent ?? 0}`,
            `  Half days:     ${attendance.summary?.half_days ?? 0}`,
            `  Times late:    ${attendance.summary?.late_count ?? 0}`,
            `  Total hours:   ${attendance.summary?.total_hours ?? 0}`,
            "",
            "MY JOBS",
            `  Total:         ${jobs.summary?.total ?? 0}`,
            `  Completed:     ${jobs.summary?.completed ?? 0}`,
            `  In Progress:   ${jobs.summary?.in_progress ?? 0}`,
            `  Declined:      ${jobs.summary?.declined ?? 0}`,
            "",
            "MY MATERIAL REQUESTS",
            `  Total:         ${materials.summary?.total ?? 0}`,
            `  Approved:      ${materials.summary?.approved ?? 0}`,
            `  Rejected:      ${materials.summary?.rejected ?? 0}`,
            `  Pending:       ${materials.summary?.pending ?? 0}`,
        ]
        const blob = new Blob([lines.join("\n")], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `my-report-${period}-${new Date().toISOString().split("T")[0]}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <EmployeeLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl font-bold">My Reports</h1>
                        <p className="text-muted-foreground text-sm mt-1">Your personal work history and stats</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="quarter">This Quarter</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => loadAll(period)} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                        </Button>
                        <Button onClick={handleExport} disabled={loading || !attendance}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {loading && !attendance && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!loading && attendance && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={Clock} label="Hours Worked" value={`${attendance.summary?.total_hours}h`} sub={`avg ${attendance.summary?.avg_hours}h/day`} color="text-blue-500" />
                            <StatCard icon={CheckCircle2} label="Days Present" value={attendance.summary?.days_present} sub={`${attendance.summary?.late_count} times late`} color="text-green-500" />
                            <StatCard icon={BarChart3} label="Jobs Completed" value={jobs?.summary?.completed} sub={`of ${jobs?.summary?.total} assigned`} color="text-purple-500" />
                            <StatCard icon={ClipboardList} label="Material Requests" value={materials?.summary?.total} sub={`${materials?.summary?.approved} approved`} color="text-orange-500" />
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid grid-cols-3 w-full">
                                <TabsTrigger value="attendance"><Clock className="h-3.5 w-3.5 mr-1.5" />Attendance</TabsTrigger>
                                <TabsTrigger value="jobs"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Jobs</TabsTrigger>
                                <TabsTrigger value="materials"><ClipboardList className="h-3.5 w-3.5 mr-1.5" />Materials</TabsTrigger>
                            </TabsList>

                            {/* ── My Attendance ── */}
                            <TabsContent value="attendance" className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <StatCard icon={CheckCircle2} label="Present" value={attendance.summary?.days_present} color="text-green-500" />
                                    <StatCard icon={XCircle} label="Absent" value={attendance.summary?.days_absent} color="text-red-500" />
                                    <StatCard icon={Timer} label="Half Days" value={attendance.summary?.half_days} color="text-yellow-500" />
                                    <StatCard icon={AlertCircle} label="Late" value={attendance.summary?.late_count} color="text-orange-500" />
                                </div>

                                <Card>
                                    <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left py-2 pr-4 font-medium">Date</th>
                                                        <th className="text-center py-2 px-2 font-medium">Check In</th>
                                                        <th className="text-center py-2 px-2 font-medium">Check Out</th>
                                                        <th className="text-center py-2 px-2 font-medium">Hours</th>
                                                        <th className="text-center py-2 px-2 font-medium">Status</th>
                                                        <th className="text-center py-2 pl-2 font-medium">Late?</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendance.history?.length === 0 && (
                                                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No attendance records for this period</td></tr>
                                                    )}
                                                    {attendance.history?.map((row: any) => (
                                                        <tr key={row.id} className="border-b last:border-0 hover:bg-muted/50">
                                                            <td className="py-2.5 pr-4 font-medium">{fmt(row.date)}</td>
                                                            <td className="text-center py-2.5 px-2 text-muted-foreground">{fmtTime(row.check_in_time)}</td>
                                                            <td className="text-center py-2.5 px-2 text-muted-foreground">{fmtTime(row.check_out_time)}</td>
                                                            <td className="text-center py-2.5 px-2 font-medium">{row.working_hours ? `${row.working_hours}h` : "—"}</td>
                                                            <td className="text-center py-2.5 px-2"><StatusBadge status={row.status} /></td>
                                                            <td className="text-center py-2.5 pl-2">
                                                                {row.is_late ? <span className="text-orange-500 text-xs font-medium">Late</span> : <span className="text-green-500 text-xs">✓</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ── My Jobs ── */}
                            <TabsContent value="jobs" className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <StatCard icon={BarChart3} label="Total Assigned" value={jobs?.summary?.total} color="text-blue-500" />
                                    <StatCard icon={CheckCircle2} label="Completed" value={jobs?.summary?.completed} color="text-green-500" />
                                    <StatCard icon={Timer} label="In Progress" value={jobs?.summary?.in_progress} color="text-orange-500" />
                                    <StatCard icon={XCircle} label="Declined" value={jobs?.summary?.declined} color="text-red-500" />
                                </div>

                                <Card>
                                    <CardHeader><CardTitle>Job History</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left py-2 pr-4 font-medium">Job</th>
                                                        <th className="text-center py-2 px-2 font-medium">Priority</th>
                                                        <th className="text-center py-2 px-2 font-medium">Progress</th>
                                                        <th className="text-center py-2 px-2 font-medium">Status</th>
                                                        <th className="text-right py-2 pl-2 font-medium">Assigned</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {jobs?.history?.length === 0 && (
                                                        <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No jobs this period</td></tr>
                                                    )}
                                                    {jobs?.history?.map((job: any) => (
                                                        <tr key={job.id} className="border-b last:border-0 hover:bg-muted/50">
                                                            <td className="py-3 pr-4">
                                                                <p className="font-medium">{job.title}</p>
                                                                {job.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{job.description}</p>}
                                                            </td>
                                                            <td className="text-center py-3 px-2">
                                                                <span className={`text-xs font-medium capitalize ${job.priority === "high" ? "text-red-500" :
                                                                        job.priority === "medium" ? "text-yellow-500" : "text-blue-400"
                                                                    }`}>{job.priority || "—"}</span>
                                                            </td>
                                                            <td className="py-3 px-2 w-28">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 bg-muted rounded-full h-1.5">
                                                                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${job.progress || 0}%` }} />
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground w-7">{job.progress || 0}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="text-center py-3 px-2"><StatusBadge status={job.employee_status || job.status} /></td>
                                                            <td className="text-right py-3 pl-2 text-muted-foreground">{fmt(job.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ── My Materials ── */}
                            <TabsContent value="materials" className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <StatCard icon={ClipboardList} label="Total Requests" value={materials?.summary?.total} color="text-blue-500" />
                                    <StatCard icon={CheckCircle2} label="Approved" value={materials?.summary?.approved} color="text-green-500" />
                                    <StatCard icon={XCircle} label="Rejected" value={materials?.summary?.rejected} color="text-red-500" />
                                    <StatCard icon={Timer} label="Pending" value={materials?.summary?.pending} color="text-yellow-500" />
                                </div>

                                <Card>
                                    <CardHeader><CardTitle>Request History</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left py-2 pr-4 font-medium">Item</th>
                                                        <th className="text-center py-2 px-2 font-medium">Qty</th>
                                                        <th className="text-center py-2 px-2 font-medium">Unit</th>
                                                        <th className="text-center py-2 px-2 font-medium">Status</th>
                                                        <th className="text-right py-2 pl-2 font-medium">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {materials?.history?.length === 0 && (
                                                        <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No material requests this period</td></tr>
                                                    )}
                                                    {materials?.history?.map((r: any) => (
                                                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                                                            <td className="py-2.5 pr-4">
                                                                <p className="font-medium">{r.item_name}</p>
                                                                {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                                                            </td>
                                                            <td className="text-center py-2.5 px-2">{r.quantity}</td>
                                                            <td className="text-center py-2.5 px-2 text-muted-foreground">{r.unit || "—"}</td>
                                                            <td className="text-center py-2.5 px-2"><StatusBadge status={r.status} /></td>
                                                            <td className="text-right py-2.5 pl-2 text-muted-foreground">{fmt(r.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
        </EmployeeLayout>
    )
}
