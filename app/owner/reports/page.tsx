"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3, Users, Clock, Package, ClipboardList,
  Download, Loader2, AlertCircle, TrendingUp, CheckCircle2,
  XCircle, Timer, BoxIcon
} from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"

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

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("month")
  const [activeTab, setActiveTab] = useState("attendance")

  const [attendance, setAttendance] = useState<any>(null)
  const [jobs, setJobs] = useState<any>(null)
  const [employees, setEmployees] = useState<any>(null)
  const [materials, setMaterials] = useState<any>(null)
  const [inventory, setInventory] = useState<any>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadAll = useCallback(async (p: string) => {
    setLoading(true)
    setError("")
    try {
      const [att, job, emp, mat, inv] = await Promise.all([
        fetchReport("attendance", p),
        fetchReport("jobs", p),
        fetchReport("employees", p),
        fetchReport("materials", p),
        fetchReport("inventory", p),
      ])
      setAttendance(att)
      setJobs(job)
      setEmployees(emp)
      setMaterials(mat)
      setInventory(inv)
    } catch (e: any) {
      setError(e.message || "Failed to load report data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll(period) }, [period, loadAll])

  const handleExport = () => {
    if (!attendance || !jobs || !materials || !inventory) return
    const lines = [
      `SmartERP Report — ${period.toUpperCase()} — Generated ${new Date().toLocaleString()}`,
      "=".repeat(60),
      "",
      "ATTENDANCE SUMMARY",
      `  Total records: ${attendance.totals?.total_records ?? 0}`,
      `  Days present:  ${attendance.totals?.total_present ?? 0}`,
      `  Days absent:   ${attendance.totals?.total_absent ?? 0}`,
      `  Total hours:   ${attendance.totals?.total_hours ?? 0}`,
      "",
      "JOBS SUMMARY",
      `  Total:         ${jobs.summary?.total ?? 0}`,
      `  Completed:     ${jobs.summary?.completed ?? 0}`,
      `  In Progress:   ${jobs.summary?.in_progress ?? 0}`,
      `  Declined:      ${jobs.summary?.declined ?? 0}`,
      `  Avg completion:${jobs.summary?.avg_completion_hours ?? "N/A"} hrs`,
      "",
      "MATERIAL REQUESTS",
      `  Total:         ${materials.summary?.total ?? 0}`,
      `  Approved:      ${materials.summary?.approved ?? 0}`,
      `  Rejected:      ${materials.summary?.rejected ?? 0}`,
      `  Pending:       ${materials.summary?.pending ?? 0}`,
      "",
      "INVENTORY",
      `  Total items:   ${inventory.summary?.total_items ?? 0}`,
      `  Low stock:     ${inventory.summary?.low_stock_count ?? 0}`,
      `  Categories:    ${inventory.summary?.category_count ?? 0}`,
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `smarterp-report-${period}-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const jTot = Number(jobs?.summary?.total ?? 0)
  const jComp = Number(jobs?.summary?.completed ?? 0)
  const mTot = Number(materials?.summary?.total ?? 0)
  const mApproved = Number(materials?.summary?.approved ?? 0)

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time data from your workforce</p>
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
              <StatCard icon={Users} label="Total Hours (Period)" value={attendance.totals?.total_hours} sub="All employees" color="text-blue-500" />
              <StatCard icon={CheckCircle2} label="Jobs Completed" value={jobs?.summary?.completed} sub={`of ${jobs?.summary?.total} total`} color="text-green-500" />
              <StatCard icon={ClipboardList} label="Material Requests" value={materials?.summary?.total} sub={`${materials?.summary?.pending} pending`} color="text-orange-500" />
              <StatCard icon={BoxIcon} label="Low Stock Items" value={inventory?.summary?.low_stock_count} sub={`of ${inventory?.summary?.total_items} total`} color="text-red-500" />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="attendance"><Clock className="h-3.5 w-3.5 mr-1.5" />Attendance</TabsTrigger>
                <TabsTrigger value="jobs"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Jobs</TabsTrigger>
                <TabsTrigger value="employees"><Users className="h-3.5 w-3.5 mr-1.5" />Employees</TabsTrigger>
                <TabsTrigger value="materials"><ClipboardList className="h-3.5 w-3.5 mr-1.5" />Materials</TabsTrigger>
                <TabsTrigger value="inventory"><Package className="h-3.5 w-3.5 mr-1.5" />Inventory</TabsTrigger>
              </TabsList>

              {/* ── Attendance Tab ── */}
              <TabsContent value="attendance" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={CheckCircle2} label="Days Present" value={attendance.totals?.total_present} color="text-green-500" />
                  <StatCard icon={XCircle} label="Days Absent" value={attendance.totals?.total_absent} color="text-red-500" />
                  <StatCard icon={Timer} label="Total Hours" value={attendance.totals?.total_hours} color="text-blue-500" />
                  <StatCard icon={TrendingUp} label="Employees Tracked" value={attendance.totals?.employees_with_records} color="text-purple-500" />
                </div>

                <Card>
                  <CardHeader><CardTitle>Per-Employee Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4 font-medium">Employee</th>
                            <th className="text-center py-2 px-2 font-medium">Present</th>
                            <th className="text-center py-2 px-2 font-medium">Absent</th>
                            <th className="text-center py-2 px-2 font-medium">Half Day</th>
                            <th className="text-center py-2 px-2 font-medium">Late</th>
                            <th className="text-right py-2 pl-2 font-medium">Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.employees?.length === 0 && (
                            <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No attendance records for this period</td></tr>
                          )}
                          {attendance.employees?.map((emp: any) => (
                            <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3 pr-4">
                                <p className="font-medium">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                              </td>
                              <td className="text-center py-3 px-2 text-green-600 font-medium">{emp.days_present}</td>
                              <td className="text-center py-3 px-2 text-red-500">{emp.days_absent}</td>
                              <td className="text-center py-3 px-2 text-yellow-500">{emp.half_days}</td>
                              <td className="text-center py-3 px-2 text-orange-500">{emp.late_count}</td>
                              <td className="text-right py-3 pl-2 font-medium">{emp.total_hours}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Jobs Tab ── */}
              <TabsContent value="jobs" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={BarChart3} label="Total Jobs" value={jobs?.summary?.total} color="text-blue-500" />
                  <StatCard icon={CheckCircle2} label="Completed" value={jobs?.summary?.completed} color="text-green-500" />
                  <StatCard icon={Timer} label="In Progress" value={jobs?.summary?.in_progress} color="text-orange-500" />
                  <StatCard icon={XCircle} label="Declined" value={jobs?.summary?.declined} color="text-red-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle>Completion Rate</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completed</span>
                          <span className="font-medium">{jTot > 0 ? Math.round((jComp / jTot) * 100) : 0}%</span>
                        </div>
                        <ProgressBar value={jComp} max={jTot} color="bg-green-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>In Progress</span>
                          <span className="font-medium">{jTot > 0 ? Math.round((Number(jobs?.summary?.in_progress) / jTot) * 100) : 0}%</span>
                        </div>
                        <ProgressBar value={Number(jobs?.summary?.in_progress)} max={jTot} color="bg-blue-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Declined</span>
                          <span className="font-medium">{jTot > 0 ? Math.round((Number(jobs?.summary?.declined) / jTot) * 100) : 0}%</span>
                        </div>
                        <ProgressBar value={Number(jobs?.summary?.declined)} max={jTot} color="bg-red-400" />
                      </div>
                      {jobs?.summary?.avg_completion_hours && (
                        <p className="text-sm text-muted-foreground pt-2">
                          Avg completion time: <span className="font-medium text-foreground">{jobs.summary.avg_completion_hours} hrs</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Top Performers</CardTitle></CardHeader>
                    <CardContent>
                      {jobs?.topEmployees?.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center">No completed jobs this period</p>
                      )}
                      <div className="space-y-3">
                        {jobs?.topEmployees?.map((e: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                              <span className="text-sm font-medium">{e.name}</span>
                            </div>
                            <Badge variant="secondary">{e.completed_jobs} jobs</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle>Jobs by Priority</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {jobs?.byPriority?.map((row: any) => (
                        <div key={row.priority} className="flex items-center gap-3">
                          <span className="text-sm w-20 capitalize">{row.priority || "None"}</span>
                          <div className="flex-1">
                            <ProgressBar value={Number(row.count)} max={jTot || 1} color={
                              row.priority === "high" ? "bg-red-500" :
                                row.priority === "medium" ? "bg-yellow-500" : "bg-blue-400"
                            } />
                          </div>
                          <span className="text-sm font-medium w-6 text-right">{row.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Employees Tab ── */}
              <TabsContent value="employees" className="mt-4">
                <Card>
                  <CardHeader><CardTitle>Employee Performance</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4 font-medium">Employee</th>
                            <th className="text-center py-2 px-2 font-medium">Dept</th>
                            <th className="text-center py-2 px-2 font-medium">Attendance %</th>
                            <th className="text-center py-2 px-2 font-medium">Hours</th>
                            <th className="text-center py-2 px-2 font-medium">Jobs Done</th>
                            <th className="text-center py-2 px-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees?.employees?.length === 0 && (
                            <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No employees found</td></tr>
                          )}
                          {employees?.employees?.map((emp: any) => (
                            <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3 pr-4">
                                <p className="font-medium">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">{emp.position || emp.email}</p>
                              </td>
                              <td className="text-center py-3 px-2 text-muted-foreground">{emp.department || "—"}</td>
                              <td className="text-center py-3 px-2">
                                {emp.attendance.attendance_rate != null ? (
                                  <span className={emp.attendance.attendance_rate >= 75 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                    {emp.attendance.attendance_rate}%
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="text-center py-3 px-2">{emp.attendance.total_hours}h</td>
                              <td className="text-center py-3 px-2 text-green-600 font-medium">{emp.jobs.completed}</td>
                              <td className="text-center py-3 px-2">
                                <StatusBadge status={emp.employment_status || "active"} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Materials Tab ── */}
              <TabsContent value="materials" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={ClipboardList} label="Total Requests" value={materials?.summary?.total} color="text-blue-500" />
                  <StatCard icon={CheckCircle2} label="Approved" value={materials?.summary?.approved} color="text-green-500" />
                  <StatCard icon={XCircle} label="Rejected" value={materials?.summary?.rejected} color="text-red-500" />
                  <StatCard icon={Timer} label="Pending" value={materials?.summary?.pending} color="text-yellow-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle>Approval Rate</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Approved</span>
                          <span className="font-medium">{mTot > 0 ? Math.round((mApproved / mTot) * 100) : 0}%</span>
                        </div>
                        <ProgressBar value={mApproved} max={mTot} color="bg-green-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Rejected</span>
                          <span className="font-medium">{mTot > 0 ? Math.round((Number(materials?.summary?.rejected) / mTot) * 100) : 0}%</span>
                        </div>
                        <ProgressBar value={Number(materials?.summary?.rejected)} max={mTot} color="bg-red-400" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Pending</span>
                          <span className="font-medium">{mTot > 0 ? Math.round((Number(materials?.summary?.pending) / mTot) * 100) : 0}%</span>
                        </div>
                        <ProgressBar value={Number(materials?.summary?.pending)} max={mTot} color="bg-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Top Requested Items</CardTitle></CardHeader>
                    <CardContent>
                      {materials?.topItems?.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center">No requests this period</p>
                      )}
                      <div className="space-y-2">
                        {materials?.topItems?.slice(0, 6).map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{item.item_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">qty {item.total_qty}</span>
                              <Badge variant="outline">{item.request_count}×</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle>Recent Requests</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4 font-medium">Item</th>
                            <th className="text-center py-2 px-2 font-medium">Qty</th>
                            <th className="text-left py-2 px-2 font-medium">Requested By</th>
                            <th className="text-center py-2 px-2 font-medium">Status</th>
                            <th className="text-right py-2 pl-2 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials?.recent?.map((r: any) => (
                            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-2 pr-4 font-medium">{r.item_name}</td>
                              <td className="text-center py-2 px-2">{r.quantity}</td>
                              <td className="py-2 px-2 text-muted-foreground">{r.requested_by}</td>
                              <td className="text-center py-2 px-2"><StatusBadge status={r.status} /></td>
                              <td className="text-right py-2 pl-2 text-muted-foreground">
                                {new Date(r.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Inventory Tab ── */}
              <TabsContent value="inventory" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Package} label="Total Items" value={inventory?.summary?.total_items} color="text-blue-500" />
                  <StatCard icon={AlertCircle} label="Low Stock" value={inventory?.summary?.low_stock_count} color="text-red-500" />
                  <StatCard icon={BoxIcon} label="Categories" value={inventory?.summary?.category_count} color="text-purple-500" />
                  <StatCard icon={XCircle} label="Archived" value={inventory?.summary?.archived_count} color="text-muted-foreground" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {inventory?.byCategory?.length === 0 && (
                          <p className="text-sm text-muted-foreground py-4 text-center">No inventory items found</p>
                        )}
                        {inventory?.byCategory?.map((cat: any) => (
                          <div key={cat.category} className="flex items-center gap-3">
                            <span className="text-sm w-32 truncate capitalize">{cat.category || "Uncategorised"}</span>
                            <div className="flex-1">
                              <ProgressBar value={Number(cat.item_count)} max={Number(inventory?.summary?.total_items) || 1} />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{cat.item_count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />Low Stock Alerts
                    </CardTitle></CardHeader>
                    <CardContent>
                      {inventory?.lowStock?.length === 0 && (
                        <p className="text-sm text-green-600 py-4 text-center">✓ All items are sufficiently stocked</p>
                      )}
                      <div className="space-y-2">
                        {inventory?.lowStock?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-600">{item.quantity} {item.unit}</p>
                              <p className="text-xs text-muted-foreground">min: {item.reorder_point}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </OwnerLayout>
  )
}
