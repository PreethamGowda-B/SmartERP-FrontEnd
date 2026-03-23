"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { HRLayout } from "@/components/hr-layout"
import { JobForm } from "@/components/job-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Job } from "@/lib/data"
import { useJobs } from "@/contexts/job-context"
import { ExportButton } from "@/components/export-button"
import { apiClient } from "@/lib/apiClient"
import {
  Search, Filter, Calendar, Users, CheckCircle2, Clock,
  AlertCircle, TrendingUp, RefreshCw, Briefcase, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

const AUTO_REFRESH_MS = 60_000

function formatDate(dateString?: string) {
  if (!dateString) return "Not set"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    })
  } catch {
    return "Invalid date"
  }
}

function formatLastUpdated(date: Date | null) {
  if (!date) return "Never"
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

function getEmployeeStatusBadge(employeeStatus?: string) {
  const status = employeeStatus?.toLowerCase() || "pending"
  switch (status) {
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none px-2 py-0.5">
          <CheckCircle2 className="w-3 h-3 mr-1" />Accepted
        </Badge>
      )
    case "declined":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none px-2 py-0.5">
          <Clock className="w-3 h-3 mr-1" />Declined
        </Badge>
      )
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none px-2 py-0.5">
          <Clock className="w-3 h-3 mr-1" />Pending
        </Badge>
      )
  }
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
    const intervalId = setInterval(handleRefresh, AUTO_REFRESH_MS)
    return () => clearInterval(intervalId)
  }, [handleRefresh])

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesPriority = priorityFilter === "all" || job.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const activeJobs = jobs.filter(j => j.status === "active").length
  const pendingJobs = jobs.filter(j => j.employee_status === "pending").length
  const completedJobs = jobs.filter(j => j.status === "completed").length

  return (
    <HRLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-2">
               <Briefcase className="w-4 h-4" />
               Task Monitoring
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">
              Project <span className="text-primary">Tasks</span>
            </h1>
            <p className="text-muted-foreground font-medium">Monitor job assignments and project execution status across your company.</p>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-tighter">Last Synchronized</span>
                <span className="text-xs font-bold font-mono">{formatLastUpdated(lastUpdated)}</span>
             </div>
             <Button
               variant="outline"
               size="sm"
               onClick={handleRefresh}
               disabled={isRefreshing}
               className="rounded-xl font-bold gap-2 px-4 h-10 border-2"
             >
               <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
               {isRefreshing ? "Syncing..." : "Sync List"}
             </Button>
             
             <ExportButton
               filename="HR_Job_Report"
               title="Job Assignment Report"
               columns={[
                 { header: "Job Title", dataKey: "title" },
                 { header: "Status", dataKey: "status" },
                 { header: "Assigned To", dataKey: "employee_email" },
                 { header: "Response", dataKey: "employee_status" },
                 { header: "Progress", dataKey: "progress", type: "number" }
               ]}
               onExport={async () => {
                 const data = await apiClient("/api/jobs")
                 return Array.isArray(data) ? data : []
               }}
             />
          </div>
        </div>

        {/* Dynamic Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <Card className="border-none shadow-sm bg-blue-500/5 group hover:bg-blue-500/10 transition-colors duration-300">
              <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">Active Tasks</p>
                       <p className="text-4xl font-black text-blue-700">{activeJobs}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                       <TrendingUp className="h-6 w-6" />
                    </div>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-none shadow-sm bg-amber-500/5 group hover:bg-amber-500/10 transition-colors duration-300">
              <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1">Pending Sync</p>
                       <p className="text-4xl font-black text-amber-700">{pendingJobs}</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
                       <Clock className="h-6 w-6" />
                    </div>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-none shadow-sm bg-emerald-500/5 group hover:bg-emerald-500/10 transition-colors duration-300">
              <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
                       <p className="text-4xl font-black text-emerald-700">{completedJobs}</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                       <CheckCircle2 className="h-6 w-6" />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by mission, client, or site location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-[1rem] border-2 focus-visible:ring-primary shadow-sm"
            />
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-[1rem] border-2 font-bold bg-white dark:bg-zinc-950">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Work Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Flow</SelectItem>
                <SelectItem value="active">Active Now</SelectItem>
                <SelectItem value="pending">Waitlist</SelectItem>
                <SelectItem value="completed">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-12 rounded-[1rem] border-2 font-bold bg-white dark:bg-zinc-950">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">Critical</SelectItem>
                <SelectItem value="medium">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const employeeStatus = job.employee_status || "pending"
            const progress = job.progress || 0
            const isCompleted = job.status?.toLowerCase() === "completed"

            return (
              <Card
                key={job.id}
                className={cn(
                  "group relative overflow-hidden bg-card border-2 hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-[1.5rem]",
                  isCompleted ? "border-emerald-100" : "border-border"
                )}
                onClick={() => setSelectedJob(job)}
              >
                <div className={cn(
                  "absolute top-0 left-0 w-full h-1",
                  job.priority === "high" ? "bg-red-500" : job.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                )} />
                
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest h-5 px-1.5 rounded-md border-2">
                      {job.client || "Generic Project"}
                    </Badge>
                    <div className="p-1 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                       <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {job.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 pt-2 space-y-6">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={cn(
                      "rounded-lg border-none shadow-sm",
                      isCompleted ? "bg-emerald-500" : "bg-sky-500"
                    )}>
                      {job.status || "Pending"}
                    </Badge>
                    {getEmployeeStatusBadge(employeeStatus)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-muted-foreground uppercase opacity-70">Project Pulse</span>
                      <span className="text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 rounded-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Assignee</p>
                        <p className="text-xs font-bold truncate max-w-full">
                           {job.employee_email ? job.employee_email.split('@')[0] : "Unassigned"}
                        </p>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Deadline</p>
                        <p className="text-xs font-bold">{formatDate(job.deadline)}</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
             <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
             </div>
             <h3 className="text-xl font-bold">No tasks found</h3>
             <p className="text-sm text-muted-foreground font-medium mt-1">We couldn't find any jobs matching your search filters.</p>
             <Button variant="link" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setPriorityFilter("all"); }} className="mt-4 font-bold">
                Reset All Filters
             </Button>
          </div>
        )}

        {/* Task Details Modal (Read-Only for HR) */}
        <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
           <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden">
              {selectedJob && (
                <div className="flex flex-col">
                   <div className={cn(
                     "px-8 py-10 text-white",
                     selectedJob.priority === "high" ? "bg-red-600" : "bg-zinc-900"
                   )}>
                      <Badge className="bg-white/20 hover:bg-white/20 border-none text-white font-bold mb-4">
                         {selectedJob.status?.toUpperCase()}
                      </Badge>
                      <h2 className="text-3xl font-black mb-2">{selectedJob.title}</h2>
                      <p className="opacity-80 font-medium text-sm">{selectedJob.description}</p>
                   </div>
                   <div className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Assignee Email</p>
                            <p className="font-bold flex items-center gap-2">
                               <Users className="w-4 h-4 text-primary" />
                               {selectedJob.employee_email || "Not assigned"}
                            </p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee Status</p>
                            <div className="pt-1">{getEmployeeStatusBadge(selectedJob.employee_status)}</div>
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mission Timeline</p>
                            <p className="font-bold flex items-center gap-2">
                               <Calendar className="w-4 h-4 text-primary" />
                               {formatDate(selectedJob.created_at)} - {formatDate(selectedJob.deadline)}
                            </p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Progress</p>
                            <p className="font-black text-2xl text-primary">{selectedJob.progress || 0}%</p>
                         </div>
                      </div>

                      <div className="pt-6 border-t font-medium text-sm text-muted-foreground flex gap-4">
                         <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Created 12 days ago
                         </div>
                         <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Sync ID: {selectedJob.id}
                         </div>
                      </div>

                      <Button onClick={() => setSelectedJob(null)} className="w-full rounded-2xl h-12 font-bold shadow-lg">
                         Close Details
                      </Button>
                   </div>
                </div>
              )}
           </DialogContent>
        </Dialog>
      </div>
    </HRLayout>
  )
}
