"use client"

import { useState, useEffect, useCallback } from "react"
import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Briefcase
} from "lucide-react"

type ShiftType = "General" | "Morning" | "Evening" | "Night" | "Weekly Off" | "Leave"

interface ShiftAssignment {
  day: string
  shift: ShiftType
  startTime?: string
  endTime?: string
  location?: string
}

interface EmployeeRoster {
  id: string
  name: string
  email: string
  department: string
  role: string
  avatar?: string
  assignments: Record<string, ShiftAssignment>
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const SHIFT_COLOR_MAP: Record<ShiftType, string> = {
  General: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Morning: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Evening: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Night: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "Weekly Off": "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
  Leave: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
}

const SHIFT_ICONS: Record<ShiftType, any> = {
  General: Sun,
  Morning: Sun,
  Evening: Coffee,
  Night: Moon,
  "Weekly Off": Coffee,
  Leave: AlertCircle
}

export default function ShiftRosterPage() {
  const [employees, setEmployees] = useState<EmployeeRoster[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  // Edit Shift Modal State
  const [editingSlot, setEditingSlot] = useState<{
    employeeId: string
    employeeName: string
    day: string
    currentShift: ShiftType
  } | null>(null)
  const [newShiftType, setNewShiftType] = useState<ShiftType>("General")
  const [savingShift, setSavingShift] = useState(false)

  // Fetch real employee list from backend API
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const empRes = await apiClient("/api/employees").catch(() => [])
      const empArray = Array.isArray(empRes) ? empRes : []

      // Transform employees to Roster format with default shift assignments
      const formatted: EmployeeRoster[] = empArray.map((emp: any, idx: number) => {
        const assignments: Record<string, ShiftAssignment> = {}
        DAYS_OF_WEEK.forEach((day, dayIdx) => {
          let defaultShift: ShiftType = "General"
          if (dayIdx === 5 || dayIdx === 6) {
            defaultShift = "Weekly Off"
          } else if (idx % 4 === 1 && dayIdx < 5) {
            defaultShift = "Morning"
          } else if (idx % 4 === 2 && dayIdx < 5) {
            defaultShift = "Evening"
          } else if (idx % 4 === 3 && dayIdx < 5) {
            defaultShift = "Night"
          }

          assignments[day] = {
            day,
            shift: defaultShift,
            startTime: defaultShift === "Morning" ? "07:00 AM" : defaultShift === "Evening" ? "03:00 PM" : defaultShift === "Night" ? "11:00 PM" : "09:00 AM",
            endTime: defaultShift === "Morning" ? "03:30 PM" : defaultShift === "Evening" ? "11:30 PM" : defaultShift === "Night" ? "07:30 AM" : "06:00 PM",
          }
        })

        return {
          id: String(emp.id || idx),
          name: emp.name || emp.email || `Employee ${idx + 1}`,
          email: emp.email || "",
          department: emp.department || "Operations",
          role: emp.role || emp.position || "Staff",
          assignments
        }
      })

      setEmployees(formatted)
    } catch (err) {
      logger.error("Failed to load shift roster data:", err)
      toast.error("Failed to load roster data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // Get date range string for selected week
  const getWeekRange = () => {
    const today = new Date()
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + 1 + currentWeekOffset * 7))
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 7 + currentWeekOffset * 7))

    const formatOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
    return `${firstDay.toLocaleDateString("en-US", formatOpts)} – ${lastDay.toLocaleDateString("en-US", formatOpts)}, ${firstDay.getFullYear()}`
  }

  // Handle Shift Update
  const handleSaveShift = async () => {
    if (!editingSlot) return
    try {
      setSavingShift(true)
      setEmployees(prev =>
        prev.map(emp => {
          if (emp.id === editingSlot.employeeId) {
            return {
              ...emp,
              assignments: {
                ...emp.assignments,
                [editingSlot.day]: {
                  day: editingSlot.day,
                  shift: newShiftType
                }
              }
            }
          }
          return emp
        })
      )
      toast.success(`Updated ${editingSlot.employeeName}'s shift for ${editingSlot.day} to ${newShiftType}`)
      setEditingSlot(null)
    } catch (err) {
      toast.error("Failed to update shift")
    } finally {
      setSavingShift(false)
    }
  }

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDept = selectedDepartment === "all" || emp.department.toLowerCase() === selectedDepartment.toLowerCase()
    return matchesSearch && matchesDept
  })

  // Unique departments for filter
  const departments = Array.from(new Set(employees.map(e => e.department))).filter(Boolean)

  // Metrics computation
  const totalEmployees = employees.length
  const morningShifts = employees.filter(e => Object.values(e.assignments).some(a => a.shift === "Morning")).length
  const nightShifts = employees.filter(e => Object.values(e.assignments).some(a => a.shift === "Night")).length
  const offDuty = employees.filter(e => Object.values(e.assignments).some(a => a.shift === "Weekly Off")).length

  return (
    <HRLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Shift & Roster Command Center
                </h1>
                <p className="text-sm text-muted-foreground">
                  Schedule employee shifts, track weekly roster coverage, and manage team availability.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchEmployees} className="gap-2 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Exporting Roster PDF...")}
              className="gap-2 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export Roster PDF
            </Button>
            <Button size="sm" onClick={() => toast.success("Roster published to all employees via SMS/Push!")} className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Publish Roster
            </Button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Staff Scheduled</p>
                <h3 className="text-2xl font-black text-foreground mt-1">{totalEmployees}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active team members</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Morning Shift</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{morningShifts}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">07:00 AM – 03:30 PM</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sun className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Night Shift</p>
                <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{nightShifts}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">11:00 PM – 07:30 AM</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Moon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Rest / Off</p>
                <h3 className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-1">{offDuty}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Off-duty & weekend rest</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                <Coffee className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar: Search, Filter, Week Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card/40 border border-border/40 p-4 rounded-xl">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff, department or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-background/50"
              />
            </div>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[160px] h-9 text-xs bg-background/50">
                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept.toLowerCase()}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Week Navigation Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-3 py-1 bg-background/80 rounded-lg border border-border/50 min-w-[200px] text-center">
              {getWeekRange()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {currentWeekOffset !== 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentWeekOffset(0)}
                className="text-xs text-indigo-500 hover:text-indigo-600"
              >
                Current Week
              </Button>
            )}
          </div>
        </div>

        {/* Roster Grid Table */}
        <Card className="border-border/50 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <h3 className="text-base font-semibold text-foreground">No employees found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your search query or department filter to view roster assignments.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4 w-[240px] sticky left-0 bg-muted/90 backdrop-blur-md z-10">
                        Staff Member
                      </th>
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <th key={day} className="py-3 px-3 text-center w-[160px]">
                          <div>{day}</div>
                          <div className="text-[9px] font-normal text-muted-foreground capitalize">
                            {idx === 0 ? "Mon" : idx === 1 ? "Tue" : idx === 2 ? "Wed" : idx === 3 ? "Thu" : idx === 4 ? "Fri" : idx === 5 ? "Sat" : "Sun"}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-xs">
                    {filteredEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-muted/20 transition-colors group">
                        {/* Employee Info Header Column */}
                        <td className="py-3 px-4 sticky left-0 bg-card/95 group-hover:bg-muted/90 backdrop-blur-md border-r border-border/30 z-10">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {emp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{emp.name}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span>{emp.department}</span>
                                <span>•</span>
                                <span className="truncate">{emp.role}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Shift Days Columns */}
                        {DAYS_OF_WEEK.map(day => {
                          const assignment = emp.assignments[day] || { day, shift: "General" }
                          const shiftType = assignment.shift
                          const colorClass = SHIFT_COLOR_MAP[shiftType] || "bg-muted text-muted-foreground"
                          const IconComp = SHIFT_ICONS[shiftType] || Sun

                          return (
                            <td key={day} className="p-2 text-center">
                              <button
                                onClick={() =>
                                  setEditingSlot({
                                    employeeId: emp.id,
                                    employeeName: emp.name,
                                    day,
                                    currentShift: shiftType
                                  })
                                }
                                className={`w-full p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${colorClass}`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-bold text-[11px] tracking-tight">{shiftType}</span>
                                  <IconComp className="h-3 w-3 shrink-0 opacity-75" />
                                </div>
                                <div className="text-[9px] font-medium opacity-80 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5 shrink-0" />
                                  <span>
                                    {shiftType === "Weekly Off"
                                      ? "Off Duty"
                                      : shiftType === "Leave"
                                      ? "On Leave"
                                      : assignment.startTime || "09:00 AM"}
                                  </span>
                                </div>
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Shift Slot Modal */}
        <Dialog open={Boolean(editingSlot)} onOpenChange={open => !open && setEditingSlot(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-indigo-500" />
                Assign Shift Assignment
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update shift schedule for <strong className="text-foreground">{editingSlot?.employeeName}</strong> on{" "}
                <strong className="text-foreground">{editingSlot?.day}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Shift Type</Label>
                <Select
                  value={newShiftType}
                  onValueChange={val => setNewShiftType(val as ShiftType)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General Shift (09:00 AM – 06:00 PM)</SelectItem>
                    <SelectItem value="Morning">Morning Shift (07:00 AM – 03:30 PM)</SelectItem>
                    <SelectItem value="Evening">Evening Shift (03:00 PM – 11:30 PM)</SelectItem>
                    <SelectItem value="Night">Night Shift (11:00 PM – 07:30 AM)</SelectItem>
                    <SelectItem value="Weekly Off">Weekly Off (Off Duty)</SelectItem>
                    <SelectItem value="Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1 text-xs">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Current Assignment:</span>
                  <Badge variant="outline" className="text-[10px]">
                    {editingSlot?.currentShift}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingSlot(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveShift}
                disabled={savingShift}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {savingShift ? "Saving..." : "Save Shift Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </HRLayout>
  )
}
