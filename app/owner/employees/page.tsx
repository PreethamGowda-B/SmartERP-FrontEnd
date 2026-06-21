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
import { Users, Search, MapPin, Clock, Phone, Mail, Trash2, Loader2, Eye, Save, X, UserCheck, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { ExportButton } from "@/components/export-button"
import { toast } from "sonner"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList, SkeletonCard } from "@/components/ui/skeleton-card"

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

  // ─── Fetch employees ──────────────────────────────────────────────────────
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
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

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

        <div className="space-y-6">
          {loading && employees.length === 0 ? (
            <SkeletonList count={6} />
          ) : error && employees.length === 0 ? (
            <ErrorView title={error.title} message={error.message} onRetry={fetchEmployees} />
          ) : filtered.length === 0 ? (
            <EmptyState 
              icon={Users}
              title="No employees found"
              description="We couldn't find any staff members matching your current search or filter criteria."
              actionLabel="Refresh Directory"
              onAction={fetchEmployees}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(filtered) && filtered.map((employee) => {
                const isEditing = editingId === employee.id

                return (
                  <Card key={employee.id} className="premium-card hover-lift group border-none shadow-sm hover:shadow-xl overflow-hidden">
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
                            <AvatarFallback className="bg-primary/5 text-primary font-bold text-lg">
                              {(employee.name || "E").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background shadow-sm",
                            employee.status === "active" ? "bg-green-500" : "bg-muted"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-black tracking-tight truncate group-hover:text-primary transition-colors">
                            {employee.name}
                          </CardTitle>
                          <p className="text-meta">{employee.position}</p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6 pt-0 space-y-5">
                      {isEditing ? (
                        <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                           <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Department</p>
                            <Select
                              value={editForm.department}
                              onValueChange={(value) => setEditForm({ ...editForm, department: value })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(DEPARTMENTS) && DEPARTMENTS.map((dept) => (
                                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Role</p>
                              <Select
                                value={editForm.role}
                                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="employee">Staff</SelectItem>
                                  <SelectItem value="hr">HR</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5 flex flex-col justify-end">
                              <div className="flex items-center justify-between h-9 px-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Active</span>
                                <Switch
                                  checked={editForm.is_active}
                                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="flex-1 btn-premium" onClick={() => saveEmployee(employee.id)} disabled={submitting}>
                              Save Changes
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditing} disabled={submitting}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-in fade-in duration-500">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Department</p>
                              <p className="text-xs font-semibold">{employee.department || "Unassigned"}</p>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Joined</p>
                              <p className="text-xs font-semibold">{employee.created_at ? new Date(employee.created_at).toLocaleDateString('en-IN') : '—'}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{employee.email}</span>
                            </div>
                            {employee.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{employee.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Customer Rating */}
                          <div className="flex items-center justify-between pt-1 pb-1 border-t border-border/50">
                            <div className="flex items-center gap-1.5">
                              {employee.rating !== null ? (
                                <>
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={cn(
                                          "h-3.5 w-3.5",
                                          star <= Math.round(employee.rating!)
                                            ? "fill-amber-400 text-amber-400"
                                            : "fill-muted text-muted-foreground/30"
                                        )}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-semibold text-amber-600">
                                    {employee.rating.toFixed(1)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star key={star} className="h-3.5 w-3.5 fill-muted text-muted-foreground/20" />
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">No ratings yet</span>
                                </>
                              )}
                            </div>
                            {employee.review_count > 0 && (
                              <span className="text-[11px] text-muted-foreground">
                                {employee.review_count} {employee.review_count === 1 ? "review" : "reviews"}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="secondary" size="sm" className="flex-1 btn-premium h-8" onClick={() => startEditing(employee)}>
                              Edit Profile
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteConfirm(employee)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

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

                  {/* Customer Rating in modal */}
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <Star className="h-5 w-5 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Customer Rating</p>
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
