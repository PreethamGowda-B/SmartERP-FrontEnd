"use client"

import { useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useJobs } from "@/contexts/job-context"
import { useAuth } from "@/contexts/auth-context"
import { Search, Filter, Calendar, MapPin, CheckCircle2, Clock, XCircle, AlertCircle, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

function formatDate(dateString?: string) {
  if (!dateString) return "Not set"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  } catch {
    return "Invalid date"
  }
}

function getEmployeeStatusBadge(employeeStatus?: string) {
  const status = employeeStatus?.toLowerCase() || "pending"

  switch (status) {
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      )
    case "declined":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" />
          Declined
        </Badge>
      )
    case "pending":
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="w-3 h-3 mr-1" />
          Action Required
        </Badge>
      )
  }
}

export default function EmployeeJobsPage() {
  const { user } = useAuth()
  const { jobs, updateJob } = useJobs()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Filter jobs assigned to the current employee
  const myJobs = jobs.filter(job =>
    job.assignedEmployees?.includes(user?.id || "") ||
    // Fallback for demo/mock data: check if job is visible to all or specific logic
    (user?.role === 'employee' && job.status === 'active')
  )

  const filteredJobs = myJobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAcceptJob = async (jobId: string) => {
    try {
      await updateJob(jobId, {
        employee_status: 'accepted',
        accepted_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to accept job:', error)
    }
  }

  const handleDeclineJob = async (jobId: string) => {
    if (confirm("Are you sure you want to decline this job assignment?")) {
      try {
        await updateJob(jobId, {
          employee_status: 'declined',
          declined_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Failed to decline job:', error)
      }
    }
  }

  const activeJobsCount = myJobs.filter(j => j.status === 'active').length
  const pendingResponseCount = myJobs.filter(j => !j.employee_status || j.employee_status === 'pending').length

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              My Jobs
            </h1>
            <p className="text-muted-foreground mt-1">View and manage your assigned projects</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-accent">{activeJobsCount}</div>
                <div className="text-xs text-muted-foreground font-medium">Active Projects</div>
              </div>
              <Briefcase className="h-8 w-8 text-accent/50" />
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-700">{pendingResponseCount}</div>
                <div className="text-xs text-yellow-600 font-medium">Pending Response</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, clients, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const employeeStatus = job.employee_status || "pending"
            const progress = job.progress || 0

            return (
              <Card
                key={job.id}
                className={cn(
                  "flex flex-col transition-all duration-300 hover:shadow-lg border-2",
                  employeeStatus === 'accepted' && "border-green-100",
                  employeeStatus === 'pending' && "border-yellow-100",
                  employeeStatus === 'declined' && "border-red-100 opacity-75"
                )}
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className="mb-1">{job.client}</Badge>
                    {getEmployeeStatusBadge(employeeStatus)}
                  </div>
                  <CardTitle className="text-lg leading-tight">{job.title}</CardTitle>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {job.location}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4 pt-0">
                  <CardDescription className="line-clamp-3 text-xs mt-2">
                    {job.description}
                  </CardDescription>

                  <div className="space-y-2 text-xs pt-2 border-t mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="font-medium">{formatDate(job.startDate)}</span>
                    </div>
                    {job.endDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span className="font-medium">{formatDate(job.endDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress - only for accepted jobs */}
                  {employeeStatus === 'accepted' && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-muted-foreground">Completion</span>
                        <span className="font-bold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Action Buttons for Pending Jobs */}
                  {employeeStatus === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                        onClick={() => handleAcceptJob(job.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
                        onClick={() => handleDeclineJob(job.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredJobs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No jobs found</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                You haven&apos;t been assigned to any jobs matching your filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  )
}
