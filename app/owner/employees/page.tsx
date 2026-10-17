"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Users,
  Search,
  MapPin,
  Clock,
  Phone,
  Mail,
  Trash2,
  Loader2,
  Eye,
  Save,
  X,
  UserCheck,
  Star,
  Edit,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Shield,
  Building2,
  Briefcase,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { ExportButton } from "@/components/export-button"
import { toast } from "sonner"
import { EnterpriseDataTable } from "@/components/data-table/enterprise-data-table"

interface Employee {
  id: number
  name: string
  position: string
  department?: string
  email: string
  phone: string
  role: "owner" | "employee" | "hr"
  status: string
  is_active?: boolean
  currentJob: string | null
  hoursThisWeek: number
  location: string
  created_at?: string
  rating: number | null
  review_count: number
}

const DEPARTMENTS = ["Engineering", "Sales", "Operations", "HR", "Finance", "Other", "Unassigned"]
const POSITIONS = ["Foreman", "Construction Worker", "Equipment Operator", "Safety Inspector", "Project Manager", "Employee"]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "clocked_in" | "inactive" | "on_site">("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Modals state
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null)
  const [viewDetails, setViewDetails] = useState<Employee | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ department: string; position: string; is_active: boolean; role: string }>({
    department: "",
    position: "",
    is_active: true,
    role: "employee",
  })

  // Clock-in status map: employee id (string) → boolean (true = clocked in today)
  const [clockStatusMap, setClockStatusMap] = useState<Record<string, boolean>>({})
  const [clockStatusLoading, setClockStatusLoading] = useState(true)

  // ─── Fetch live attendance overview ─────────────────────────────────────
  const fetchClockStatus = useCallback(async () => {
    setClockStatusLoading(true)
    try {
      const data = await apiClient<any>("/api/attendance/overview")
      const records = Array.isArray(data) ? data : (data?.employees ?? data?.records ?? data?.attendance ?? [])
      const map: Record<string, boolean> = {}
      records.forEach((record: any) => {
        const uid = String(record.user_id ?? record.userId ?? record.employee_id ?? "")
        if (uid) map[uid] = record.check_in_time != null
      })
      setClockStatusMap(map)
    } catch {
      // Fail gracefully — dots show default status
    } finally {
      setClockStatusLoading(false)
    }
  }, [])

  // ─── Fetch employees roster ─────────────────────────────────────────────
  const fetchEmployees = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const data = await apiClient<any>("/api/employees")
      setEmployees(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError({
        title: "Employee Directory Unavailable",
        message: err.message || "We couldn't retrieve the staff roster. Please verify your connection."
      })
    } finally {
      if (showLoading) setLoading(false)
    }
    fetchClockStatus()
  }, [fetchClockStatus])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchEmployees(false), fetchClockStatus()])
    setIsRefreshing(false)
  }

  // ─── Start editing ──────────────────────────────────────────────────────
  const startEditing = (employee: Employee) => {
    setEditingId(employee.id)
    setEditForm({
      department: employee.department || "Unassigned",
      position: employee.position || "Employee",
      is_active: employee.is_active !== false,
      role: employee.role || "employee",
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({ department: "", position: "", is_active: true, role: "employee" })
  }

  // ─── Save employee updates ──────────────────────────────────────────────
  const saveEmployee = async (employeeId: number) => {
    setSubmitting(true)
    try {
      await apiClient(`/api/employees/${employeeId}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      })
      setEditingId(null)
      await fetchEmployees(false)
      toast.success("Employee details updated successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to update employee")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Toggle account status ──────────────────────────────────────────────
  const toggleAccountStatus = async (employee: Employee) => {
    setSubmitting(true)
    try {
      await apiClient(`/api/employees/${employee.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !employee.is_active }),
      })
      await fetchEmployees(false)
      toast.success(`Account ${employee.is_active ? "deactivated" : "activated"} successfully`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update account status")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete employee ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSubmitting(true)
    try {
      await apiClient(`/api/employees/${deleteConfirm.id}`, {
        method: "DELETE",
      })
      const name = deleteConfirm.name
      setDeleteConfirm(null)
      await fetchEmployees(false)
      toast.success(`${name} removed from organization roster`)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete employee")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const name = e.name || ""
      const position = e.position || ""
      const email = e.email || ""
      const dept = e.department || ""
      const phone = e.phone || ""
      const job = e.currentJob || ""
      const loc = e.location || ""

      const query = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        position.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        dept.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query) ||
        job.toLowerCase().includes(query) ||
        loc.toLowerCase().includes(query)

      const matchesDept =
        departmentFilter === "all" ||
        (departmentFilter === "Unassigned" ? !e.department || e.department === "Unassigned" : e.department === departmentFilter)

      let matchesStatus = true
      if (statusFilter === "active") {
        matchesStatus = e.status === "active" && e.is_active !== false
      } else if (statusFilter === "clocked_in") {
        matchesStatus = clockStatusMap[String(e.id)] === true
      } else if (statusFilter === "inactive") {
        matchesStatus = e.status === "inactive" || e.is_active === false
      } else if (statusFilter === "on_site") {
        matchesStatus = Boolean((e.location && e.location !== "Unassigned" && e.location !== "—") || e.currentJob)
      }

      return matchesSearch && matchesDept && matchesStatus
    })
  }, [employees, searchTerm, departmentFilter, statusFilter, clockStatusMap])

  // ─── KPI Stats ──────────────────────────────────────────────────────────
  const totalCount = employees.length
  const activeCount = employees.filter((e) => e.status === "active" && e.is_active !== false).length
  const clockedInCount = employees.filter((e) => clockStatusMap[String(e.id)] === true).length
  const onSiteCount = employees.filter((e) => Boolean((e.location && e.location !== "Unassigned" && e.location !== "—") || e.currentJob)).length
  const avgHours = totalCount > 0
    ? (employees.reduce((sum, e) => sum + Number(e.hoursThisWeek || 0), 0) / totalCount).toFixed(1)
    : "0.0"

  // Available unique departments
  const departmentOptions = useMemo(() => {
    const set = new Set<string>()
    DEPARTMENTS.forEach((d) => set.add(d))
    employees.forEach((e) => {
      if (e.department) set.add(e.department)
    })
    return Array.from(set)
  }, [employees])

  return (
    <OwnerLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* ─── Top Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Employee Directory
              </h1>
              <Badge variant="outline" className="text-xs font-mono font-semibold ml-1">
                {totalCount} Staff
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Organization roster, system access roles, field operations, and live shift telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl h-9 text-xs font-semibold"
              disabled={isRefreshing}
              onClick={handleRefresh}
              aria-label="Refresh employee directory"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-secondary/60 p-0.5 rounded-xl border border-border/70">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Table View"
                aria-label="Table View"
              >
                <TableIcon className="h-4 w-4" />
                <span className="hidden sm:inline text-[11px]">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid Cards View"
                aria-label="Grid Cards View"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline text-[11px]">Cards</span>
              </button>
            </div>

            <ExportButton
              filename="Employee_Directory_Report"
              title="Employee Directory"
              subtitle="Official Organization Roster"
              onExport={async () => {
                const data = await apiClient<any>("/api/employees")
                return Array.isArray(data) ? data : []
              }}
              columns={[
                { header: "Name", dataKey: "name" },
                { header: "Email", dataKey: "email" },
                { header: "Department", dataKey: "department" },
                { header: "Position", dataKey: "position" },
                { header: "Role", dataKey: "role" },
                { header: "Status", dataKey: "status" },
                { header: "Location", dataKey: "location" },
                { header: "Hours This Week", dataKey: "hoursThisWeek" },
                { header: "Joined Date", dataKey: "created_at", type: "date" },
              ]}
            />
          </div>
        </div>

        {/* ─── Executive KPI Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total Staff */}
          <Card
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-2xl border transition-all cursor-pointer hover:border-primary/40 shadow-xs",
              statusFilter === "all" ? "ring-2 ring-primary/20 border-primary bg-primary/5" : "border-border/70 bg-card hover:bg-secondary/20"
            )}
          >
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Staff</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                {totalCount}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">Full organization roster</p>
            </CardContent>
          </Card>

          {/* Currently Active */}
          <Card
            onClick={() => setStatusFilter("active")}
            className={cn(
              "rounded-2xl border transition-all cursor-pointer hover:border-emerald-500/40 shadow-xs",
              statusFilter === "active" ? "ring-2 ring-emerald-500/20 border-emerald-500 bg-emerald-500/5" : "border-border/70 bg-card hover:bg-secondary/20"
            )}
          >
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Roster</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                {activeCount}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Active system accounts</p>
            </CardContent>
          </Card>

          {/* Clocked In Today */}
          <Card
            onClick={() => setStatusFilter("clocked_in")}
            className={cn(
              "rounded-2xl border transition-all cursor-pointer hover:border-emerald-500/40 shadow-xs",
              statusFilter === "clocked_in" ? "ring-2 ring-emerald-500/20 border-emerald-500 bg-emerald-500/5" : "border-border/70 bg-card hover:bg-secondary/20"
            )}
          >
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">On Shift Now</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 relative">
                  <Activity className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums flex items-center gap-2">
                <span>{clockedInCount}</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">Clocked in today</p>
            </CardContent>
          </Card>

          {/* On Field / Job */}
          <Card
            onClick={() => setStatusFilter("on_site")}
            className={cn(
              "rounded-2xl border transition-all cursor-pointer hover:border-purple-500/40 shadow-xs",
              statusFilter === "on_site" ? "ring-2 ring-purple-500/20 border-purple-500 bg-purple-500/5" : "border-border/70 bg-card hover:bg-secondary/20"
            )}
          >
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Field Operators</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                {onSiteCount}
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Active field assignments</p>
            </CardContent>
          </Card>

          {/* Average Hours */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs col-span-2 sm:col-span-1">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Avg Workload</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                {avgHours}h
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">Weekly cumulative avg</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Filter & Search Control Bar ─────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/70 shadow-xs">
          {/* Search bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, position, department, email, phone, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 h-10 text-xs sm:text-sm rounded-xl bg-background border-border/80"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Filter Select */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-44 h-10 text-xs font-semibold rounded-xl bg-background border-border/80">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-semibold">
                  All Departments ({totalCount})
                </SelectItem>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-xs">
                    {dept} ({employees.filter((e) => (dept === "Unassigned" ? !e.department || e.department === "Unassigned" : e.department === dept)).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/80 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  statusFilter === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  statusFilter === "active" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("clocked_in")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
                  statusFilter === "clocked_in" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Shift
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  statusFilter === "inactive" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Suspended
              </button>
            </div>
          </div>
        </div>

        {/* ─── Presentation Mode: Grid vs Table ───────────────────────────── */}
        {viewMode === "grid" ? (
          /* Cards Grid View */
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="rounded-2xl border border-border/70 p-5 space-y-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-28 bg-muted rounded" />
                        <div className="h-3 w-20 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-3/4 bg-muted rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-2xl bg-card">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-foreground">No employees match your criteria</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Try adjusting your search query, status filter, or department selection.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl text-xs"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setDepartmentFilter("all")
                  }}
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((emp) => {
                  const isClocked = clockStatusMap[String(emp.id)] === true
                  const isActive = emp.status === "active" && emp.is_active !== false

                  return (
                    <Card
                      key={emp.id}
                      className="rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden"
                    >
                      <CardContent className="p-5 space-y-4">
                        {/* Card Top Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="relative shrink-0">
                            <Avatar className="h-12 w-12 ring-2 ring-border/80">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                {(emp.name || "E").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                                clockStatusLoading
                                  ? "bg-muted"
                                  : isClocked
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-slate-400"
                              )}
                              title={isClocked ? "On active shift today" : "Not clocked in"}
                            />
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={isActive ? "default" : "secondary"}
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {isActive ? "Active" : "Suspended"}
                            </Badge>
                            {emp.role && (
                              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                                {emp.role}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Name & Position */}
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-base text-foreground truncate" title={emp.name}>
                            {emp.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate" title={emp.position}>
                            {emp.position || "Employee"}
                          </p>
                          <div className="pt-1.5 flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[11px] font-medium bg-secondary/40 text-muted-foreground border-border/60">
                              <Building2 className="h-3 w-3 mr-1 text-primary" />
                              {emp.department || "Unassigned"}
                            </Badge>
                          </div>
                        </div>

                        {/* Contact info */}
                        <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
                          <a
                            href={`mailto:${emp.email}`}
                            className="flex items-center gap-2 truncate hover:text-primary transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                            <span className="truncate">{emp.email}</span>
                          </a>
                          {emp.phone && (
                            <a
                              href={`tel:${emp.phone}`}
                              className="flex items-center gap-2 truncate hover:text-primary transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                              <span>{emp.phone}</span>
                            </a>
                          )}
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px]">
                          <div className="p-2 rounded-xl bg-secondary/40 border border-border/50">
                            <span className="text-muted-foreground font-semibold block text-[10px]">Weekly Hours</span>
                            <span className="font-bold font-mono text-foreground">{Number(emp.hoursThisWeek || 0).toFixed(1)}h</span>
                          </div>

                          <div className="p-2 rounded-xl bg-secondary/40 border border-border/50">
                            <span className="text-muted-foreground font-semibold block text-[10px]">Rating</span>
                            {emp.rating !== null ? (
                              <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span>{emp.rating.toFixed(1)}</span>
                                <span className="text-[9px] text-muted-foreground">({emp.review_count})</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                      </CardContent>

                      {/* Card Action Footer */}
                      <div className="px-5 py-3 border-t border-border/60 bg-secondary/20 flex items-center justify-between gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 px-2"
                          onClick={() => setViewDetails(emp)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Profile
                        </Button>

                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                            onClick={() => startEditing(emp)}
                            title="Edit Role & Details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => setDeleteConfirm(emp)}
                            title="Remove Employee"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* Enterprise Data Table View */
          <Card className="rounded-2xl border border-border/70 shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <EnterpriseDataTable<Employee>
                data={filtered}
                columns={[
                  {
                    id: "employee",
                    header: "Staff Member",
                    enableSorting: true,
                    cell: (employee) => {
                      const isClocked = clockStatusMap[String(employee.id)] === true
                      return (
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <Avatar className="h-9 w-9 ring-1 ring-border">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {(employee.name || "E").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background",
                                clockStatusLoading
                                  ? "bg-muted"
                                  : isClocked
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-slate-400"
                              )}
                              title={
                                clockStatusLoading
                                  ? "Loading shift status..."
                                  : isClocked
                                  ? "Clocked in today"
                                  : "Not clocked in"
                              }
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground text-xs sm:text-sm truncate">{employee.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{employee.position || "Employee"}</div>
                          </div>
                        </div>
                      )
                    },
                  },
                  {
                    id: "department",
                    header: "Department",
                    accessorKey: "department",
                    enableSorting: true,
                    cell: (employee) => (
                      <Badge variant="outline" className="text-xs font-medium bg-secondary/30">
                        {employee.department || "Unassigned"}
                      </Badge>
                    ),
                  },
                  {
                    id: "contact",
                    header: "Contact Channels",
                    enableSorting: false,
                    cell: (employee) => (
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <a
                          href={`mailto:${employee.email}`}
                          className="flex items-center gap-1.5 hover:text-primary transition-colors truncate"
                        >
                          <Mail className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">{employee.email}</span>
                        </a>
                        {employee.phone && (
                          <a
                            href={`tel:${employee.phone}`}
                            className="flex items-center gap-1.5 hover:text-primary transition-colors"
                          >
                            <Phone className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                            <span>{employee.phone}</span>
                          </a>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: "status",
                    header: "Account State",
                    accessorKey: "status",
                    enableSorting: true,
                    cell: (employee) => {
                      const isActive = employee.status === "active" && employee.is_active !== false
                      return (
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              isActive
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {isActive ? "Active" : "Suspended"}
                          </Badge>
                          <Switch
                            checked={employee.is_active !== false}
                            onCheckedChange={() => toggleAccountStatus(employee)}
                            disabled={submitting}
                            className="scale-75"
                            aria-label={`Toggle account status for ${employee.name}`}
                          />
                        </div>
                      )
                    },
                  },
                  {
                    id: "hours",
                    header: "Weekly Hours",
                    accessorKey: "hoursThisWeek",
                    enableSorting: true,
                    cell: (employee) => (
                      <span className="font-mono text-xs font-bold tabular-nums">
                        {Number(employee.hoursThisWeek || 0).toFixed(1)}h
                      </span>
                    ),
                  },
                  {
                    id: "rating",
                    header: "Performance",
                    accessorKey: "rating",
                    enableSorting: true,
                    cell: (employee) =>
                      employee.rating !== null ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                            {employee.rating.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            ({employee.review_count})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      ),
                  },
                  {
                    id: "joined",
                    header: "Joined Date",
                    accessorKey: "created_at",
                    enableSorting: true,
                    cell: (employee) =>
                      employee.created_at
                        ? new Date(employee.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—",
                  },
                  {
                    id: "actions",
                    header: "Actions",
                    enableSorting: false,
                    enableHiding: false,
                    headerClassName: "text-right",
                    cell: (employee) => (
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => setViewDetails(employee)}
                          title="View Profile Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                          onClick={() => startEditing(employee)}
                          title="Edit Role & Department"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => setDeleteConfirm(employee)}
                          title="Delete Employee"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                getRowId={(e) => String(e.id)}
                searchPlaceholder="Search employees by name, role, email..."
                isLoading={loading}
                isError={!!error}
                errorMessage={error?.message}
                onRetry={() => fetchEmployees(true)}
                storageKey="owner_employees_table"
                emptyTitle="No employees found"
                emptyDescription="We couldn't find any staff members matching your search or filter criteria."
                emptyIcon={Users}
              />
            </CardContent>
          </Card>
        )}

        {/* ─── MODAL: VIEW EMPLOYEE PROFILE DETAILS ───────────────────────── */}
        <Dialog open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
          <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden border border-border/80 shadow-2xl">
            {viewDetails && (
              <div>
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <Avatar className="h-16 w-16 ring-4 ring-background shadow-sm">
                          <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                            {(viewDetails.name || "E").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background",
                            clockStatusMap[String(viewDetails.id)]
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-slate-400"
                          )}
                          title={clockStatusMap[String(viewDetails.id)] ? "Active on shift today" : "Not clocked in"}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-extrabold text-foreground">{viewDetails.name}</h2>
                          <Badge
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              viewDetails.status === "active" && viewDetails.is_active !== false
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {viewDetails.status === "active" && viewDetails.is_active !== false ? "Active" : "Suspended"}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{viewDetails.position || "Employee"}</p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {viewDetails.department || "Unassigned"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">
                            Role: {viewDetails.role || "employee"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Details Content */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                  {/* Contact & Location Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-primary" /> Email Address
                      </span>
                      <a href={`mailto:${viewDetails.email}`} className="text-xs font-semibold text-foreground hover:underline block truncate">
                        {viewDetails.email}
                      </a>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-primary" /> Phone Number
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {viewDetails.phone || "Not on file"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-primary" /> Work Base Location
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {viewDetails.location || "Unassigned"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-primary" /> Logged This Week
                      </span>
                      <p className="text-xs font-bold font-mono text-foreground">
                        {Number(viewDetails.hoursThisWeek || 0).toFixed(1)} hours
                      </p>
                    </div>
                  </div>

                  {/* Current Job Assignment if any */}
                  {viewDetails.currentJob && (
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> Active Job Assignment
                      </span>
                      <p className="text-xs font-bold text-foreground">{viewDetails.currentJob}</p>
                    </div>
                  )}

                  {/* Customer Rating & Reviews */}
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        Client Feedback &amp; Performance
                      </span>
                      {viewDetails.rating !== null ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <span>{viewDetails.rating.toFixed(1)} / 5.0</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({viewDetails.review_count} {viewDetails.review_count === 1 ? "review" : "reviews"})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">No customer reviews yet</span>
                      )}
                    </div>

                    <PerformanceHistorySection employeeId={viewDetails.id} />
                  </div>

                  {/* Joined Date Metadata */}
                  {viewDetails.created_at && (
                    <p className="text-[11px] text-muted-foreground">
                      Account registered on{" "}
                      {new Date(viewDetails.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-4 border-t border-border/60 bg-secondary/20 flex flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs gap-1.5"
                    onClick={() => {
                      const emp = viewDetails
                      setViewDetails(null)
                      startEditing(emp)
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Details
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setViewDetails(null)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── MODAL: EDIT EMPLOYEE DETAILS ─────────────────────────────────── */}
        <Dialog open={editingId !== null} onOpenChange={(open) => !open && cancelEditing()}>
          <DialogContent className="max-w-lg rounded-2xl border border-border/80 shadow-2xl">
            <DialogHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Edit Employee Details</DialogTitle>
                  <DialogDescription className="text-xs">
                    Update organization department, position title, system access role, and account state.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              {(() => {
                const emp = employees.find((e) => e.id === editingId)
                return emp ? (
                  <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
                    <Avatar className="h-10 w-10 ring-1 ring-border">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {(emp.name || "E").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-foreground truncate">{emp.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{emp.email}</p>
                    </div>
                  </div>
                ) : null
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Department</label>
                  <Select
                    value={editForm.department}
                    onValueChange={(val) => setEditForm((prev) => ({ ...prev, department: val }))}
                  >
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept} className="text-xs">
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Position */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Position / Title</label>
                  <Input
                    value={editForm.position}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g. Lead CNC Technician"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">System Role</label>
                  <Select
                    value={editForm.role}
                    onValueChange={(val) => setEditForm((prev) => ({ ...prev, role: val }))}
                  >
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee" className="text-xs">
                        Employee (Field &amp; Standard)
                      </SelectItem>
                      <SelectItem value="hr" className="text-xs">
                        HR Administrator
                      </SelectItem>
                      <SelectItem value="owner" className="text-xs">
                        Owner (Executive Access)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Status Switch */}
                <div className="space-y-1.5 flex flex-col justify-center">
                  <label className="text-xs font-bold text-foreground">Account Status</label>
                  <div className="flex items-center justify-between h-10 px-3 border border-border/80 rounded-xl bg-background">
                    <span className="text-xs font-medium">
                      {editForm.is_active ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
                      ) : (
                        <span className="text-muted-foreground">Suspended</span>
                      )}
                    </span>
                    <Switch
                      checked={editForm.is_active}
                      onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/60 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={submitting}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => editingId !== null && saveEmployee(editingId)}
                disabled={submitting}
                className="rounded-xl text-xs gap-1.5 font-bold"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── MODAL: DELETE EMPLOYEE CONFIRMATION ──────────────────────────── */}
        <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <DialogContent className="max-w-md rounded-2xl border border-destructive/30 shadow-2xl">
            <DialogHeader className="pb-2">
              <div className="flex items-center gap-2.5 text-destructive">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold text-destructive">Remove Employee</DialogTitle>
              </div>
              <DialogDescription className="text-xs pt-1.5">
                This action will revoke all system credentials and remove this staff member from active operations.
              </DialogDescription>
            </DialogHeader>

            {deleteConfirm && (
              <div className="py-3 text-xs text-muted-foreground space-y-2">
                <p>
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-foreground">{deleteConfirm.name}</strong> ({deleteConfirm.email})?
                </p>
                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-[11px]">
                  ⚠️ All associated operational records and historical assignments will be unlinked from active workflows.
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(null)}
                disabled={submitting}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={submitting}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {submitting ? "Removing..." : "Delete Employee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}

function PerformanceHistorySection({ employeeId }: { employeeId: number }) {
  const [history, setHistory] = useState<{ average_rating: number; total_reviews: number; reviews: any[] }>({
    average_rating: 0,
    total_reviews: 0,
    reviews: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPerformance() {
      try {
        const data = await apiClient<any>(`/api/employees/${employeeId}/performance`)
        if (data) setHistory(data)
      } catch (err) {
        logger.error("Failed to load performance history", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPerformance()
  }, [employeeId])

  if (loading) {
    return <div className="text-xs text-muted-foreground py-2">Loading client review history...</div>
  }

  if (!history.reviews || history.reviews.length === 0) {
    return (
      <div className="p-3 text-center rounded-xl bg-muted/30 border border-border/40 text-[11px] text-muted-foreground">
        No client reviews recorded for this employee yet.
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recent Client Reviews:</p>
      {history.reviews.map((rev) => (
        <div key={rev.id} className="p-2.5 rounded-xl bg-background border border-border/60 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground text-xs">{rev.customer_name || "Client"}</span>
            <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{rev.rating}</span>
            </div>
          </div>
          {rev.comment && <p className="text-muted-foreground italic text-[11px]">"{rev.comment}"</p>}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-0.5">
            <span>{rev.job_title || "Service Job"}</span>
            <span>{new Date(rev.created_at).toLocaleDateString("en-IN")}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
