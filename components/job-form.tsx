"use client"

import React, { useState, useEffect, useCallback, memo } from "react"
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
import type { Job } from "@/lib/data"
import { logger } from "@/lib/logger"

interface JobFormProps {
  job?: Job
  onSubmit: (job: Partial<Job>) => void
  onCancel: () => void
  isLoading?: boolean
}

// ─── Memoized Sub-Components to isolate typing re-renders ─────────────────────

const EmployeeSelector = memo(function EmployeeSelector({
  employees,
  assignedEmployees,
  isLoading,
  onToggle,
}: {
  employees: any[]
  assignedEmployees: string[]
  isLoading: boolean
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      <Label>Assign Employees</Label>
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading employees...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg bg-accent/5">
          <UsersIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No employees found.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Please add employees first in the Employee Management page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {employees.map((employee) => {
            const empIdStr = employee.id.toString()
            const isChecked = assignedEmployees.includes(empIdStr)
            return (
              <div
                key={employee.id}
                className="flex items-center space-x-2 p-2 border rounded hover:bg-accent/5 transition-colors"
              >
                <Checkbox
                  id={`emp-${employee.id}`}
                  checked={isChecked}
                  onCheckedChange={() => onToggle(empIdStr)}
                />
                <Label htmlFor={`emp-${employee.id}`} className="flex-1 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">{employee.position || "Employee"}</p>
                  </div>
                </Label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

const DatePickerSection = memo(function DatePickerSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate?: Date
  endDate?: Date
  onStartDateChange: (date?: Date) => void
  onEndDateChange: (date?: Date) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={startDate} onSelect={onStartDateChange} />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label>End Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={endDate} onSelect={onEndDateChange} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
})

const VisibilitySwitch = memo(function VisibilitySwitch({
  visibleToAll,
  onChange,
}: {
  visibleToAll: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/20">
      <div className="space-y-1">
        <Label className="text-base font-semibold">Visible to All Employees</Label>
        <p className="text-sm text-muted-foreground">
          When enabled, this job will be visible to all employees in the portal
        </p>
      </div>
      <Switch
        checked={visibleToAll}
        onCheckedChange={onChange}
        aria-label="Make job visible to all employees"
      />
    </div>
  )
})

// ─── Main Optimized JobForm Component ─────────────────────────────────────────

export function JobForm({ job, onSubmit, onCancel, isLoading }: JobFormProps) {
  const [jobType, setJobType] = useState<"general" | "machine">((job as any)?.machine_id ? "machine" : "general")
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
    visible_to_all: (job as any)?.visible_to_all ?? true,
    is_billable: (job as any)?.is_billable ?? Boolean(job?.client),
    // CNC fields
    machine_id: (job as any)?.machine_id || "",
    controller_type: (job as any)?.controller_type || "Fanuc 0i-MF",
    alarm_code: (job as any)?.alarm_code || "",
    service_type: (job as any)?.service_type || "breakdown",
  })

  const [employees, setEmployees] = useState<any[]>([])
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false)
  const [machines, setMachines] = useState<any[]>([])

  useEffect(() => {
    async function fetchEmployees() {
      setIsEmployeesLoading(true)
      try {
        const data = await apiClient("/api/employees")
        if (Array.isArray(data)) {
          setEmployees(data)
        }
      } catch (error) {
        logger.error("Failed to fetch employees:", error)
      } finally {
        setIsEmployeesLoading(false)
      }
    }
    async function fetchMachines() {
      try {
        const res = await apiClient<{ success: boolean; machines: any[] }>("/api/machines")
        if (res?.machines) {
          setMachines(res.machines)
        }
      } catch (error) {
        console.warn("Failed to fetch machines:", error)
      }
    }
    fetchEmployees()
    fetchMachines()
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

  const handleEmployeeToggle = useCallback((employeeId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(employeeId)
        ? prev.assignedEmployees.filter((id: string) => id !== employeeId)
        : [...prev.assignedEmployees, employeeId],
    }))
  }, [])

  const handleStartDateChange = useCallback((date?: Date) => {
    setFormData((prev) => ({ ...prev, startDate: date }))
  }, [])

  const handleEndDateChange = useCallback((date?: Date) => {
    setFormData((prev) => ({ ...prev, endDate: date }))
  }, [])

  const handleVisibilityChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, visible_to_all: checked }))
  }, [])

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
          {/* View Switcher: General Job vs Machine-Based Job */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setJobType("general")}
              className={cn(
                "flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all",
                jobType === "general"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              General Job (Default)
            </button>
            <button
              type="button"
              onClick={() => setJobType("machine")}
              className={cn(
                "flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
                jobType === "machine"
                  ? "bg-amber-600 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              ⚙️ Machine-Based Job (CNC)
            </button>
          </div>

          {/* CNC-Specific Extension Fields */}
          {jobType === "machine" && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
              <div className="font-semibold text-xs text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
                ⚙️ CNC Machinery Parameters
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Registered Machine</Label>
                  <Select
                    value={formData.machine_id}
                    onValueChange={(val) => {
                      const selectedM = machines.find((m) => String(m.id) === val)
                      setFormData((prev) => ({
                        ...prev,
                        machine_id: val,
                        client: selectedM?.customer_name || prev.client,
                        location: selectedM?.plant_name || selectedM?.area_location || prev.location,
                        controller_type: selectedM?.controller_type || prev.controller_type,
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Machine..." />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.length === 0 ? (
                        <SelectItem value="none" disabled>No machines registered yet</SelectItem>
                      ) : (
                        machines.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.machine_name} ({m.make} {m.model} - S/N: {m.serial_number})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, service_type: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Service Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakdown">🔴 Breakdown Repair</SelectItem>
                      <SelectItem value="preventive">🟡 Preventive Maintenance (PM)</SelectItem>
                      <SelectItem value="installation">🟢 Installation & Commissioning</SelectItem>
                      <SelectItem value="calibration">🔵 Calibration & Laser Alignment</SelectItem>
                      <SelectItem value="inspection">🟣 Inspection & Audit</SelectItem>
                      <SelectItem value="amc_visit">⭐ AMC Scheduled Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Controller Type</Label>
                  <Select
                    value={formData.controller_type}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, controller_type: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Controller" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fanuc 0i-MF">Fanuc 0i-MF / 0i-TF</SelectItem>
                      <SelectItem value="Siemens 828D">Siemens 828D / 840D</SelectItem>
                      <SelectItem value="Mitsubishi M80">Mitsubishi M80 / M800</SelectItem>
                      <SelectItem value="Heidenhain TNC 640">Heidenhain TNC 640</SelectItem>
                      <SelectItem value="Haas NextGen">Haas NextGen Control</SelectItem>
                      <SelectItem value="Other">Other / Custom Controller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alarm_code">Alarm Code (Optional)</Label>
                  <Input
                    id="alarm_code"
                    value={formData.alarm_code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, alarm_code: e.target.value }))}
                    placeholder="e.g. SV0401, 2001 Spindle Overload"
                  />
                </div>
              </div>
            </div>
          )}
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

          <DatePickerSection
            startDate={formData.startDate}
            endDate={formData.endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />

          <EmployeeSelector
            employees={employees}
            assignedEmployees={formData.assignedEmployees}
            isLoading={isEmployeesLoading}
            onToggle={handleEmployeeToggle}
          />

          <VisibilitySwitch
            visibleToAll={formData.visible_to_all}
            onChange={handleVisibilityChange}
          />

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
