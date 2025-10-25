"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Plus, MapPin, Clock, Phone, Mail, Loader2 } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { useEmployees } from "@/contexts/employee-context"

export default function EmployeesPage() {
  const { employees, addEmployee, isLoading } = useEmployees()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddEmployee = async () => {
    if (newEmployee.name && newEmployee.position && newEmployee.email && newEmployee.phone) {
      setIsSubmitting(true)
      try {
        const newEmployeeData = {
          id: Date.now().toString(),
          name: newEmployee.name,
          position: newEmployee.position,
          email: newEmployee.email,
          phone: newEmployee.phone,
          status: "active" as const,
          currentJob: null,
          hoursThisWeek: 0,
          location: "Unassigned",
          avatar: "/placeholder.svg",
        }

        await addEmployee(newEmployeeData)
        setNewEmployee({ name: "", position: "", email: "", phone: "" })
        setShowAddEmployee(false)
      } catch (err) {
        console.error("Failed to add employee:", err)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      alert("Please fill in all required fields")
    }
  }

  if (isLoading) {
    return (
      <OwnerLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Syncing your workspace…</p>
          </div>
        </div>
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <Button onClick={() => setShowAddEmployee(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
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
                  <p className="text-2xl font-bold">{employees.filter((e) => e.status === "active").length}</p>
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
                  <p className="text-2xl font-bold">{employees.filter((e) => e.location !== "Off-site").length}</p>
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
                  <p className="text-2xl font-bold">
                    {employees.length > 0
                      ? Math.round(employees.reduce((sum, e) => sum + (e.hoursThisWeek || 0), 0) / employees.length)
                      : 0}
                  </p>
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

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                  <Badge variant={employee.status === "active" ? "default" : "secondary"}>{employee.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.location}</span>
                </div>
                {employee.currentJob && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Current Job: </span>
                    <span className="font-medium">{employee.currentJob}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.hoursThisWeek || 0} hours this week</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Employee Modal */}
        {showAddEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Add New Employee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="Enter employee name"
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
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddEmployee} className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Employee"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddEmployee(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
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
