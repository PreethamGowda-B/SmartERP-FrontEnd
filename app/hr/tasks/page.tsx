"use client"

import { useState, useCallback, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Job } from "@/lib/data"
import { useJobs } from "@/contexts/job-context"
import { apiClient } from "@/lib/apiClient"
import {
  Search, Filter, Calendar, Users, CheckCircle2, Clock,
  AlertCircle, TrendingUp, RefreshCw, Briefcase, UserCheck,
  ChevronRight, User
} from "lucide-react"
import { cn } from "@/lib/utils"

const AUTO_REFRESH_MS = 60_000

function formatDate(dateString?: string) {
  if (!dateString) return "Not set"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return "Invalid date"
  }
}

function getStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case "completed":
      return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Completed</Badge>
    case "active":
    case "in_progress":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">In Progress</Badge>
    case "open":
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">Open</Badge>
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Cancelled</Badge>
    default:
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Pending</Badge>
  }
}

function getEmployeeStatusBadge(employeeStatus?: string) {
  const s = (employeeStatus || "").toLowerCase()
  if (s === "accepted") return (
    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 gap-1">
      <CheckCircle2 className="w-3 h-3" />Accepted
    </Badge>
  )
  if (s === "declined") return (
    <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 gap-1">
      <AlertCircle className="w-3 h-3" />Declined
    </Badge>
  )
  if (s === "arrived") return (
    <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 gap-1">
      <UserCheck className="w-3 h-3" />Arrived
    </Badge>
  )
  if (s === "assigned") return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 gap-1">
      <Clock className="w-3 h-3" />Awaiting Accept
    </Badge>
  )
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 gap-1">
      <Clock className="w-3 h-3" />Unassigned
    </Badge>
  )
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high:   "bg-orange-500",
  medium: "bg-amber-400",
  low:    "bg-gray-300",
}

export default function HRTasksPage() {
  const { jobs, refreshJobs } = useJobs()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshJobs()
      setLastUpdated(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshJobs])

  useEffect(() => {
    handleRefresh()
    const id = setInterval(handleRefresh, AUTO_REFRESH_MS)
    return () => clearInterval(id)
  }, [handleRefresh])

  const filteredJobs = jobs.filter((job) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch = !q ||
      job.title?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      job.employee_email?.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesPriority = priorityFilter === "all" || job.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const activeCount    = jobs.filter(j => (j.status as string) === "active" || (j.status as string) === "in_progress").length
  const pendingCount   = jobs.filter(j => !j.employee_status || (j.employee_status as string) === "assigned").length
  const completedCount = jobs.filter(j => j.status === "completed").length

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor all job assignments · Last synced {lastUpdated ? lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "never"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2 self-start sm:self-auto">
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Syncing..." : "Sync"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{activeCount}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Done</span>
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{completedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job list */}
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
            <Briefcase className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-muted-foreground">No tasks found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredJobs.map((job) => {
              const priorityColor = PRIORITY_COLORS[job.priority || "medium"] || PRIORITY_COLORS.medium
              const isCustomer = (job as any).source === "customer"

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="bg-card border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4"
                >
                  {/* Priority stripe */}
                  <div className={cn("w-1 h-12 rounded-full shrink-0", priorityColor)} />

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm truncate">{job.title}</span>
                      {isCustomer && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-300 text-indigo-600 bg-indigo-50">
                          Customer
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {job.employee_email && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {job.employee_email.split("@")[0]}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(job.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  {(job.progress || 0) > 0 && (
                    <div className="hidden sm:flex flex-col items-end gap-1 w-24 shrink-0">
                      <span className="text-xs font-medium text-primary">{job.progress}%</span>
                      <Progress value={job.progress || 0} className="h-1.5 w-full" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(job.status)}
                    {getEmployeeStatusBadge(job.employee_status)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Detail dialog */}
        <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <DialogContent className="max-w-lg">
            {selectedJob && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedJob.title}</DialogTitle>
                  <DialogDescription>Job details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(selectedJob.status)}
                    {getEmployeeStatusBadge(selectedJob.employee_status)}
                    {(selectedJob as any).source === "customer" && (
                      <Badge variant="outline" className="border-indigo-300 text-indigo-600 bg-indigo-50">Customer Job</Badge>
                    )}
                  </div>

                  {selectedJob.description && (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{selectedJob.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Assigned To</p>
                      <p className="font-medium">{selectedJob.employee_email || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Priority</p>
                      <p className="font-medium capitalize">{selectedJob.priority || "Medium"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                      <p className="font-medium">{formatDate(selectedJob.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Progress</p>
                      <p className="font-bold text-primary">{selectedJob.progress || 0}%</p>
                    </div>
                  </div>

                  {(selectedJob.progress || 0) > 0 && (
                    <Progress value={selectedJob.progress || 0} className="h-2" />
                  )}

                  <Button onClick={() => setSelectedJob(null)} className="w-full">Close</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </HRLayout>
  )
}
