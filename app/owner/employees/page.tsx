"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Plus, MapPin, Clock, Phone, Mail, Trash2, Loader2, Eye } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"

interface Employee {
  id: number
  name: string
  position: string
  email: string
  phone: string
  status: string
  currentJob: string | null
  hoursThisWeek: number
  location: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null)
  const [viewDetails, setViewDetails] = useState<Employee | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
  })

  // ─── Fetch employees ──────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient("/api/employees")
      setEmployees(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Failed to load employees")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // ─── Create employee ──────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newEmployee.name || !newEmployee.position || !newEmployee.email || !newEmployee.phone) {
      setError("Please fill in all fields")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await apiClient("/api/employees", {
        method: "POST",
        body: JSON.stringify({
          name: newEmployee.name,
          email: newEmployee.email,
          position: newEmployee.position,
          phone: newEmployee.phone,
        }),
      })
      // Success — close modal and refresh the list from the server
      setShowAddModal(false)
      setNewEmployee({ name: "", position: "", email: "", phone: "" })
      await fetchEmployees()
    } catch (err: any) {
      setError(err.message || "Failed to create employee")
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
      setDeleteConfirm(null)
      await fetchEmployees()
    } catch (err: any) {
      setError(err.message || "Failed to delete employee")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalCount = employees.length
  const activeCount = employees.filter((e) => e.status === "active").length
  const onSiteCount = employees.filter((e) => e.location && e.location !== "Unassigned").length
  const avgHours = totalCount > 0
    ? Math.round(employees.reduce((sum, e) => sum + (e.hoursThisWeek || 0), 0) / totalCount)
    : 0

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <Button onClick={() => { setShowAddModal(true); setError(null) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Global error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">&times;</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">On Site</p>
                  <p className="text-2xl font-bold">{onSiteCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Hours/Week</p>
                  <p className="text-2xl font-bold">{avgHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No employees found</p>
            <p className="text-sm">
              {employees.length === 0 ? "Click \"Add Employee\" to create your first employee." : "Try adjusting your search or filter."}
            </p>
          </div>
        )}

        {/* Employee Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((employee) => (
              <Card key={employee.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{employee.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{employee.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                      {employee.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{employee.location}</span>
                  </div>
                  {employee.currentJob && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Current Job: </span>
                      <span className="font-medium">{employee.currentJob}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{employee.hoursThisWeek} hours this week</span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewDetails(employee)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                      onClick={() => setDeleteConfirm(employee)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ─── ADD EMPLOYEE MODAL ─────────────────────────────────────────── */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Add New Employee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="e.g. Mike Johnson"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <Select
                    value={newEmployee.position}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Foreman">Foreman</SelectItem>
                      <SelectItem value="Construction Worker">Construction Worker</SelectItem>
                      <SelectItem value="Equipment Operator">Equipment Operator</SelectItem>
                      <SelectItem value="Safety Inspector">Safety Inspector</SelectItem>
                      <SelectItem value="Project Manager">Project Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="mike.johnson@company.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    placeholder="+1 (555) 234-5678"
                  />
                </div>
                <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
                  A default password (Employee@123) will be assigned. The employee can change it after first login.
                </p>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreate} className="flex-1" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {submitting ? "Creating..." : "Create Employee"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddModal(false); setError(null) }} className="flex-1" disabled={submitting}>
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
                    {error}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete <span className="font-semibold text-foreground">{deleteConfirm.name}</span> ({deleteConfirm.email})?
                </p>
                <p className="text-sm text-muted-foreground">
                  This will permanently remove their account, employee profile, and all associated data. This action cannot be undone.
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
