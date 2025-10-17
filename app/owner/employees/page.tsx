"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Plus, MapPin, Clock, Phone, Mail } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"

const defaultEmployees = [
  {
    id: 1,
    name: "Mike Johnson",
    position: "Foreman",
    email: "mike.johnson@company.com",
    phone: "+1 (555) 234-5678",
    status: "active",
    currentJob: "Downtown Office Complex",
    hoursThisWeek: 42,
    location: "Downtown Site",
  avatar: "/placeholder-user.jpg",
  },
  {
    id: 2,
    name: "Sarah Davis",
    position: "Construction Worker",
    email: "sarah.davis@company.com",
    phone: "+1 (555) 345-6789",
    status: "active",
    currentJob: "Riverside Mall",
    hoursThisWeek: 38,
    location: "Riverside Site",
  avatar: "/placeholder-user.jpg",
  },
  {
    id: 3,
    name: "Tom Wilson",
    position: "Equipment Operator",
    email: "tom.wilson@company.com",
    phone: "+1 (555) 456-7890",
    status: "inactive",
    currentJob: null,
    hoursThisWeek: 0,
    location: "Off-site",
  avatar: "/placeholder-user.jpg",
  },
  {
    id: 4,
    name: "Lisa Brown",
    position: "Safety Inspector",
    email: "lisa.brown@company.com",
    phone: "+1 (555) 567-8901",
    status: "active",
    currentJob: "Harbor Bridge",
    hoursThisWeek: 40,
    location: "Harbor Site",
  avatar: "/placeholder-user.jpg",
  },
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(defaultEmployees)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    // Fetch employees from backend API. If the backend isn't available (dev), fall back to defaultEmployees.
    let mounted = true
    async function load() {
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || '') + '/api/employees', {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('API unavailable')
        const data = await res.json()
        if (mounted && Array.isArray(data)) setEmployees(data)
      } catch (err) {
        // Backend not reachable or CORS/auth issue — use local defaults
        console.warn('Could not fetch employees from backend, using local defaults:', err)
        if (mounted) setEmployees(defaultEmployees)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddEmployee = () => {
    if (newEmployee.name && newEmployee.position && newEmployee.email && newEmployee.phone) {
      const newEmployeeData = {
        id: Date.now(),
        name: newEmployee.name,
        position: newEmployee.position,
        email: newEmployee.email,
        phone: newEmployee.phone,
        status: "active",
        currentJob: null,
        hoursThisWeek: 0,
        location: "Unassigned",
  avatar: "/placeholder-user.jpg",
      }
  ;
      // Try to create the employee via backend API. If it fails, fall back to local update.
      (async () => {
        try {
          const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || '') + '/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              email: newEmployee.email,
              password: 'ChangeMe123!', // default dev password when creating via UI
              position: newEmployee.position,
              phone: newEmployee.phone,
            }),
          })
          if (!res.ok) throw new Error('Failed to create on backend')
          const created = await res.json()
          const updatedEmployees = [...employees, created]
          setEmployees(updatedEmployees)
          alert(`Employee ${created.name || newEmployee.name} has been added successfully!`)
        } catch (err) {
          console.warn('Backend create failed, falling back to local update:', err)
          const updatedEmployees = [...employees, newEmployeeData]
          setEmployees(updatedEmployees)
        } finally {
          setNewEmployee({ name: "", position: "", email: "", phone: "" })
          setShowAddEmployee(false)
        }
      })()
    } else {
      alert("Please fill in all required fields")
    }
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
                  {Math.round(employees.reduce((sum, e) => sum + e.hoursThisWeek, 0) / employees.length)}
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
                <span>{employee.hoursThisWeek} hours this week</span>
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
                <Button onClick={handleAddEmployee} className="flex-1">
                  Add Employee
                </Button>
                <Button variant="outline" onClick={() => setShowAddEmployee(false)} className="flex-1">
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
