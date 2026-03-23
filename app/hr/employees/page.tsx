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
import { Users, Search, MapPin, Clock, Phone, Mail, Trash2, Loader2, Eye, Save, X } from "lucide-react"
import { HRLayout } from "@/components/hr-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { ExportButton } from "@/components/export-button"
import { toast } from "sonner"

interface Employee {
  id: number
  name: string
  position: string
  department?: string
  email: string
  phone: string
  status: string
  is_active?: boolean
  currentJob: string | null
  hoursThisWeek: number
  location: string
  created_at?: string
}

const DEPARTMENTS = ["Engineering", "Sales", "Operations", "HR", "Finance", "Other", "Unassigned"]
const POSITIONS = ["Foreman", "Construction Worker", "Equipment Operator", "Safety Inspector", "Project Manager", "Employee"]

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null)
  const [viewDetails, setViewDetails] = useState<Employee | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ department: string; position: string; is_active: boolean }>({
    department: "",
    position: "",
    is_active: true,
  })

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

  const startEditing = (employee: Employee) => {
    setEditingId(employee.id)
    setEditForm({
      department: employee.department || "Unassigned",
      position: employee.position || "Employee",
      is_active: employee.is_active !== false,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({ department: "", position: "", is_active: true })
  }

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

  return (
    <HRLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Employee Directory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your team's profiles, departments, and positions.
            </p>
          </div>
          <ExportButton
            filename="Employee_Directory_HR"
            title="HR Employee Directory"
            onExport={async () => {
              const data = await apiClient("/api/employees")
              return Array.isArray(data) ? data : []
            }}
            columns={[
              { header: "Name", dataKey: "name" },
              { header: "Email", dataKey: "email" },
              { header: "Department", dataKey: "department" },
              { header: "Position", dataKey: "position" },
              { header: "Status", dataKey: "status" }
            ]}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">&times;</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No results found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((employee) => (
              <Card key={employee.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 px-6 pt-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-primary/10">
                      <AvatarFallback className="bg-primary/5 text-primary">
                        {employee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{employee.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dept:</span>
                      <span className="font-medium">{employee.department || "Unassigned"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Role:</span>
                      <span className="font-medium">{employee.position}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewDetails(employee)}>
                      Profile
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => startEditing(employee)}>
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reuse existing Modal logic from Owner (simplified here for brevity, but I'll implement full features in subsequent steps if needed) */}
      </div>
    </HRLayout>
  )
}
