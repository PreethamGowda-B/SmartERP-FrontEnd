"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon, Loader2, Users as UsersIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/apiClient"
import { useEffect } from "react"
import type { Job } from "@/lib/data"

interface JobFormProps {
  job?: Job
  onSubmit: (job: Partial<Job>) => void
  onCancel: () => void
  isLoading?: boolean
}

export function JobForm({ job, onSubmit, onCancel, isLoading }: JobFormProps) {
  const [formData, setFormData] = useState({
    title: job?.title || "",
    client: job?.client || "",
    location: job?.location || "",
    description: job?.description || "",
    budget: job?.budget?.toString() || "",
    priority: job?.priority || "medium",
    status: job?.status || "pending",
    startDate: job?.startDate ? new Date(job.startDate) : undefined,
    endDate: job?.endDate ? new Date(job.endDate) : undefined,
    assignedEmployees: job?.assignedEmployees || [],
    visible_to_all: (job as any)?.visible_to_all ?? true,  // Default to true so employees can see jobs
  })

  const [employees, setEmployees] = useState<any[]>([])
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false)

  useEffect(() => {
    async function fetchEmployees() {
      setIsEmployeesLoading(true)
      try {
        const data = await apiClient("/api/employees")
        if (Array.isArray(data)) {
          setEmployees(data)
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error)
      } finally {
        setIsEmployeesLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      budget: Number.parseFloat(formData.budget) || 0,
      startDate: formData.startDate?.toISOString().split("T")[0],
      endDate: formData.endDate?.toISOString().split("T")[0],
    })
  }

  const handleEmployeeToggle = (employeeId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(employeeId)
        ? prev.assignedEmployees.filter((id: string) => id !== employeeId)
        : [...prev.assignedEmployees, employeeId],
    }))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{job ? "Edit Job" : "Create New Job"}</CardTitle>
        <CardDescription>
          {job ? "Update job details and assignments" : "Add a new project to your job list"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter job title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData((prev) => ({ ...prev, client: e.target.value }))}
                placeholder="Client name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Job site address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed job description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                placeholder="0"
                min="0"
                step="100"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Assign Employees</Label>
            {isEmployeesLoading ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading employees...</span>
              </div>
            ) : employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg bg-accent/5">
                <UsersIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No employees found.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Please add employees first in the Employee Management page.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent/5 transition-colors">
                    <Checkbox
                      id={`emp-${employee.id}`}
                      checked={formData.assignedEmployees.includes(employee.id.toString())}
                      onCheckedChange={() => handleEmployeeToggle(employee.id.toString())}
                    />
                    <Label htmlFor={`emp-${employee.id}`} className="flex-1 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.position || 'Employee'}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/20">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Visible to All Employees</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, this job will be visible to all employees in the portal
              </p>
            </div>
            <Switch
              checked={formData.visible_to_all}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, visible_to_all: checked }))}
              aria-label="Make job visible to all employees"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {job ? "Updating..." : "Creating..."}
                </>
              ) : job ? (
                "Update Job"
              ) : (
                "Create Job"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
