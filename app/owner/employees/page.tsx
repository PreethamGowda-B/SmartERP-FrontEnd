"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Search, MapPin, Clock, Phone, Mail, Trash2, Loader2, Eye, Save, X, UserCheck, Star, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { ExportButton } from "@/components/export-button"
import { toast } from "sonner"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList, SkeletonCard } from "@/components/ui/skeleton-card"
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
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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

  // ─── Fetch employees ──────────────────────────────────────────────────────
  const fetchClockStatus = useCallback(async () => {
    setClockStatusLoading(true)
    try {
      const data = await apiClient("/api/attendance/overview")
      // API returns { summary, employees: [...] }
      const records = Array.isArray(data) ? data : (data?.employees ?? data?.records ?? data?.attendance ?? [])
      const map: Record<string, boolean> = {}
      records.forEach((record: any) => {
        const uid = String(record.user_id ?? record.userId ?? record.employee_id ?? "")
        if (uid) map[uid] = record.check_in_time != null
      })
      setClockStatusMap(map)
    } catch {
      // Fail silently — dots will show red (not clocked in) by default
    } finally {
      setClockStatusLoading(false)
    }
  }, [])

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient("/api/employees")
      setEmployees(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError({
        title: "Employee Directory Unavailable",
        message: err.message || "We couldn't retrieve the staff roster. Please verify your connection."
      })
    } finally {
      setLoading(false)
    }
    // Refresh clock status concurrently with employee list
    fetchClockStatus()
  }, [fetchClockStatus])

  useEffect(() => {
    fetchEmployees()
    fetchClockStatus()
  }, [fetchEmployees, fetchClockStatus])

  // ─── Start editing ────────────────────────────────────────────────────────
  const startEditing = (employee: Employee) => {
    setEditingId(employee.id)
    setEditForm({
      department: employee.department || "Unassigned",
      position: employee.position || "Employee",
      is_active: employee.is_active !== false,
      role: employee.role || "employee",
    })
  }

  // ─── Cancel editing ───────────────────────────────────────────────────────
  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({ department: "", position: "", is_active: true, role: "employee" })
  }

  // ─── Save employee updates ────────────────────────────────────────────────
  const saveEmployee = async (employeeId: number) => {
    setSubmitting(true)
    setError(null)
    try {
      await apiClient(`/api/employees/${employeeId}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      })
      setEditingId(null)
      await fetchEmployees()
      toast.success("✅ Employee updated successfully")
    } catch (err: any) {
      setError(err.message || "Failed to update employee")
      toast.error("Failed to update employee")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Toggle account status ────────────────────────────────────────────────
  const toggleAccountStatus = async (employee: Employee) => {
    setSubmitting(true)
    setError(null)
    try {
      await apiClient(`/api/employees/${employee.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !employee.is_active }),
      })
      await fetchEmployees()
      toast.success(`✅ Account ${employee.is_active ? 'deactivated' : 'activated'}`)
    } catch (err: any) {
      setError(err.message || "Failed to update account status")
      toast.error("Failed to update account status")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete employee ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSubmitting(true)
    setError(null)
    try {
      await apiClient(`/api/employees/${deleteConfirm.id}`, {
        method: "DELETE",
      })
      const name = deleteConfirm.name
      setDeleteConfirm(null)
      await fetchEmployees()
      toast.success(`🗑️ ${name} removed successfully`)
    } catch (err: any) {
      setError(err.message || "Failed to delete employee")
      toast.error("Failed to delete employee")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = employees.filter((e) => {
    const name = e.name || ""
    const position = e.position || ""
    const email = e.email || ""
    
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalCount = Array.isArray(employees) ? employees.length : 0
  const activeCount = Array.isArray(employees) ? employees.filter((e) => e.status === "active").length : 0
  const onSiteCount = Array.isArray(employees) ? employees.filter((e) => e.location && e.location !== "Unassigned").length : 0
  const avgHours = totalCount > 0
    ? Math.round((Array.isArray(employees) ? employees : []).reduce((sum, e) => sum + Number(e.hoursThisWeek || 0), 0) / totalCount)
    : 0

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Employee <span className="text-primary">Directory</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              Access staff profiles, manage organizational roles, and monitor workforce distribution.
            </p>
          </div>
          <ExportButton
            filename="Employee_Directory_Report"
            title="Employee Directory"
            subtitle={`Official Organization Roster`}
            onExport={async () => {
              const data = await apiClient("/api/employees")
              return Array.isArray(data) ? data : []
            }}
            columns={[
              { header: "Name", dataKey: "name" },
              { header: "Email", dataKey: "email" },
              { header: "Department", dataKey: "department" },
              { header: "Position", dataKey: "position" },
              { header: "Status", dataKey: "status" },
              { header: "Joined Date", dataKey: "created_at", type: "date" }
            ]}
          />
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Staff", value: totalCount, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Currently Active", value: activeCount, icon: UserCheck, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20" },
            { label: "On Field", value: onSiteCount, icon: MapPin, color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20" },
            { label: "Work Efficiency", value: `${avgHours}h`, icon: Clock, color: "text-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/20" },
          ].map((stat, i) => (
            <Card key={i} className={cn("premium-card hover-lift-subtle border", stat.border)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{stat.label}</p>
                    <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                  </div>
                  <div className={cn("p-3 rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enterprise Data Table */}
        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-0">
            <EnterpriseDataTable<Employee>
              data={filtered}
              columns={[
                {
                  id: "employee",
                  header: "Employee",
                  enableSorting: true,
                  cell: (employee) => (
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9 ring-1 ring-border">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {(employee.name || "E").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background",
                            clockStatusLoading
                              ? "bg-muted"
                              : clockStatusMap[String(employee.id)]
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          )}
                          title={
                            clockStatusLoading
                              ? "Loading attendance..."
                              : clockStatusMap[String(employee.id)]
                              ? "Clocked in today"
                              : "Not clocked in"
                          }
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{employee.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{employee.position}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "department",
                  header: "Department",
                  accessorKey: "department",
                  enableSorting: true,
                  cell: (employee) => (
                    <Badge variant="outline" className="text-xs font-normal">
                      {employee.department || "Unassigned"}
                    </Badge>
                  ),
                },
                {
                  id: "contact",
                  header: "Contact",
                  enableSorting: false,
                  cell: (employee) => (
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  id: "status",
                  header: "Status",
                  accessorKey: "status",
                  enableSorting: true,
                  cell: (employee) => (
                    <Badge
                      variant={employee.status === "active" ? "success" : "secondary"}
                      className="text-xs capitalize"
                    >
                      {employee.status}
                    </Badge>
                  ),
                },
                {
                  id: "rating",
                  header: "Rating",
                  accessorKey: "rating",
                  enableSorting: true,
                  cell: (employee) =>
                    employee.rating !== null ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {employee.rating.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
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
                      ? new Date(employee.created_at).toLocaleDateString("en-IN")
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
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setViewDetails(employee)}
                        title="View Profile Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => startEditing(employee)}
                        title="Edit Employee"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
              onRetry={fetchEmployees}
              storageKey="owner_employees_table"
              emptyTitle="No employees found"
              emptyDescription="We couldn't find any staff members matching your search or filter criteria."
              emptyIcon={Users}
            />
          </CardContent>
        </Card>

        {/* ─── EDIT EMPLOYEE MODAL ────────────────────────────────────────── */}
        {editingId !== null && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg shadow-2xl border border-border/80 bg-card">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-bold">Edit Employee Details</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelEditing}
                    className="h-8 w-8 rounded-full"
                    disabled={submitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md px-3 py-2 text-xs">
                    {error.message}
                  </div>
                )}

                {(() => {
                  const emp = employees.find((e) => e.id === editingId)
                  return emp ? (
                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                      <Avatar className="h-12 w-12 border">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                          {(emp.name || "E").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{emp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                      </div>
                    </div>
                  ) : null
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Department</label>
                    <Select
                      value={editForm.department}
                      onValueChange={(val) => setEditForm((prev) => ({ ...prev, department: val }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
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
                    <label className="text-xs font-semibold text-foreground">Position / Title</label>
                    <Input
                      value={editForm.position}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, position: e.target.value }))}
                      placeholder="e.g. Senior Technician"
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">System Role</label>
                    <Select
                      value={editForm.role}
                      onValueChange={(val) => setEditForm((prev) => ({ ...prev, role: val }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee" className="text-xs">Employee</SelectItem>
                        <SelectItem value="hr" className="text-xs">HR Administrator</SelectItem>
                        <SelectItem value="owner" className="text-xs">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Account Status Switch */}
                  <div className="space-y-1.5 flex flex-col justify-center">
                    <label className="text-xs font-semibold text-foreground">Account Status</label>
                    <div className="flex items-center gap-3 h-9 px-3 border rounded-md bg-background">
                      <Switch
                        checked={editForm.is_active}
                        onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, is_active: checked }))}
                      />
                      <span className="text-xs font-medium">
                        {editForm.is_active ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Active Account</span>
                        ) : (
                          <span className="text-muted-foreground">Inactive / Suspended</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={() => saveEmployee(editingId)}
                    disabled={submitting}
                    className="flex-1 gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {submitting ? "Saving Changes..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelEditing}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── DELETE CONFIRMATION MODAL ──────────────────────────────────── */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-sm mx-4">
              <CardHeader>
                <CardTitle className="text-red-600">Delete Employee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
                    {error.message}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete <span className="font-semibold text-foreground">{deleteConfirm.name}</span> ({deleteConfirm.email})?
                </p>
                <p className="text-sm text-muted-foreground">
                  This will permanently remove their account and all associated data. This action cannot be undone.
                </p>
                <div className="flex gap-2 pt-2">
                  <Button variant="destructive" onClick={handleDelete} className="flex-1" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {submitting ? "Deleting..." : "Delete Employee"}
                  </Button>
                  <Button variant="outline" onClick={() => { setDeleteConfirm(null); setError(null) }} className="flex-1" disabled={submitting}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── VIEW DETAILS MODAL ─────────────────────────────────────────── */}
        {viewDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Employee Details</CardTitle>
                  <Badge variant={viewDetails.status === "active" ? "default" : "secondary"}>
                    {viewDetails.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-2xl">{viewDetails.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{viewDetails.name}</h3>
                    <p className="text-sm text-muted-foreground">{viewDetails.position}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{viewDetails.email}</p>
                    </div>
                  </div>

                  {viewDetails.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{viewDetails.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{viewDetails.department || "Unassigned"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{viewDetails.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Hours This Week</p>
                      <p className="text-sm font-medium">{viewDetails.hoursThisWeek} hours</p>
                    </div>
                  </div>

                  {viewDetails.currentJob && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Current Job</p>
                        <p className="text-sm font-medium">{viewDetails.currentJob}</p>
                      </div>
                    </div>
                  )}

                  {viewDetails.created_at && (
                    <div className="flex items-start gap-3 pt-2 border-t">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Account Created</p>
                        <p className="text-sm font-medium">
                          {new Date(viewDetails.created_at).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Customer Rating & Detailed Performance History */}
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <Star className="h-5 w-5 text-amber-400 mt-0.5" />
                    <div className="w-full">
                      <p className="text-xs text-muted-foreground">Customer Rating & Performance</p>
                      {viewDetails.rating !== null ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-4 w-4",
                                  star <= Math.round(viewDetails.rating!)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-muted text-muted-foreground/20"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold">{viewDetails.rating.toFixed(1)} / 5</span>
                          <span className="text-xs text-muted-foreground">
                            ({viewDetails.review_count} {viewDetails.review_count === 1 ? "review" : "reviews"})
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-0.5">No customer reviews yet</p>
                      )}

                      {/* Review History Breakdown */}
                      <PerformanceHistorySection employeeId={viewDetails.id} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setViewDetails(null)} className="flex-1">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </OwnerLayout>
  )
}

function PerformanceHistorySection({ employeeId }: { employeeId: number }) {
  const [history, setHistory] = useState<{ average_rating: number; total_reviews: number; reviews: any[] }>({ average_rating: 0, total_reviews: 0, reviews: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPerformance() {
      try {
        const data = await apiClient(`/api/employees/${employeeId}/performance`)
        if (data) setHistory(data)
      } catch (err) {
        logger.error("Failed to load performance history", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPerformance()
  }, [employeeId])

  if (loading) return <div className="text-xs text-muted-foreground mt-2">Loading review history...</div>
  if (!history.reviews || history.reviews.length === 0) return null

  return (
    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
      <p className="text-xs font-bold text-foreground">Recent Customer Feedback:</p>
      {history.reviews.map((rev) => (
        <div key={rev.id} className="p-2 rounded-lg bg-slate-50 border text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">{rev.customer_name || "Client"}</span>
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-bold">{rev.rating}</span>
            </div>
          </div>
          {rev.comment && <p className="text-slate-600 italic">"{rev.comment}"</p>}
          <p className="text-[10px] text-slate-400">{rev.job_title || "Job"} • {new Date(rev.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}
