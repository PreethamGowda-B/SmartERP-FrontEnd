"use client"

import { useJobs } from "@/contexts/job-context"
import { apiClient } from "@/lib/apiClient"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Calendar, Users, Briefcase, Clock, CheckCircle2, AlertCircle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

function getStatusIcon(status?: string) {
  const normalizedStatus = status?.toLowerCase() || "pending"
  switch (normalizedStatus) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />
    case "active":
    case "in progress":
      return <Clock className="w-4 h-4 text-blue-600" />
    case "pending":
      return <AlertCircle className="w-4 h-4 text-yellow-600" />
    default:
      return null
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return "Date unknown"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return "Date unknown"
  }
}

export default function EmployeeJobsPage() {
  const { jobs, refreshJobs } = useJobs()
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)
  const [progressValues, setProgressValues] = useState<Record<string, number>>({})
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleAcceptJob = async (jobId: string) => {
    setUpdatingJobId(jobId)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        showNotification('success', 'Job accepted successfully!')
        if (refreshJobs) await refreshJobs()
      } else {
        const errorText = await response.text()
        console.error('Accept failed:', errorText)
        throw new Error('Failed to accept job')
      }
    } catch (error) {
      console.error('Accept error:', error)
      showNotification('error', 'Failed to accept job. Please try again.')
    } finally {
      setUpdatingJobId(null)
    }
  }

  const handleDeclineJob = async (jobId: string) => {
    setUpdatingJobId(jobId)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        showNotification('success', 'Job declined.')
        if (refreshJobs) await refreshJobs()
      } else {
        throw new Error('Failed to decline job')
      }
    } catch (error) {
      showNotification('error', 'Failed to decline job. Please try again.')
    } finally {
      setUpdatingJobId(null)
    }
  }

  const handleProgressUpdate = async (jobId: string, progress: number) => {
    setUpdatingJobId(jobId)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress })
      })

      if (response.ok) {
        showNotification('success', `Progress updated to ${progress}%`)
        if (refreshJobs) await refreshJobs()
      } else {
        throw new Error('Failed to update progress')
      }
    } catch (error) {
      showNotification('error', 'Failed to update progress. Please try again.')
    } finally {
      setUpdatingJobId(null)
    }
  }

  if (jobs.length === 0) {
    return (
      <EmployeeLayout>
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Available Jobs
            </h1>
            <p className="text-muted-foreground mt-2">Browse and manage your assigned construction projects</p>
          </div>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No jobs available yet</p>
              <p className="text-sm text-muted-foreground/70 mt-2">New projects will appear here when assigned</p>
            </CardContent>
          </Card>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Notification Banner */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Available Jobs
          </h1>
          <p className="text-muted-foreground mt-2">Browse and manage your assigned construction projects</p>
        </div>

        {/* Jobs Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const status = job.status || "pending"
            const employeeStatus = job.employee_status || "pending"
            const progress = progressValues[job.id] ?? (job.progress || 0)
            const createdDate = job.created_at || job.createdAt
            const isVisibleToAll = job.visible_to_all || false
            const assignedEmployees = job.assignedEmployees || []

            const isPending = employeeStatus === 'pending'
            const isAccepted = employeeStatus === 'accepted'
            const isDeclined = employeeStatus === 'declined'
            const isCompleted = status?.toLowerCase() === 'completed'

            return (
              <Card
                key={job.id}
                className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-2 ${isAccepted ? 'border-blue-100' : ''
                  } ${isDeclined ? 'opacity-60 border-red-100' : ''} ${isPending ? 'hover:border-primary/20' : ''
                  }`}
              >
                {/* Colored top border indicator */}
                <div
                  className={`h-1.5 w-full ${isCompleted ? 'bg-green-500' : ''
                    } ${isAccepted && !isCompleted ? 'bg-blue-500' : ''} ${isPending ? 'bg-yellow-500' : ''
                    } ${isDeclined ? 'bg-red-500' : ''}`}
                />

                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusIcon(status)}
                        <Badge variant={status === 'completed' ? 'default' : 'outline'} className="font-semibold">
                          {status}
                        </Badge>
                        {isAccepted && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Accepted
                          </Badge>
                        )}
                        {isDeclined && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Declined
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {job.title}
                      </CardTitle>
                    </div>
                  </div>

                  <CardDescription className="text-sm line-clamp-3 leading-relaxed">
                    {job.description || "No description provided"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress Bar - Only show for accepted jobs */}
                  {isAccepted && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">Progress</span>
                        <span className="font-bold text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2.5 bg-secondary" />

                      {!isCompleted && (
                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Update Progress
                          </label>
                          <Slider
                            value={[progress]}
                            onValueChange={(value) => setProgressValues({ ...progressValues, [job.id]: value[0] })}
                            max={100}
                            step={10}
                            className="cursor-pointer"
                            disabled={updatingJobId === job.id}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                          {progress !== (job.progress || 0) && (
                            <Button
                              size="sm"
                              onClick={() => handleProgressUpdate(job.id, progress)}
                              disabled={updatingJobId === job.id}
                              className="w-full mt-2"
                            >
                              {updatingJobId === job.id ? "Updating..." : "Save Progress"}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="space-y-3 pt-2">
                    {/* Assignment Info */}
                    <div className="flex items-start gap-3">
                      <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">Team</p>
                        <p className="text-sm truncate">
                          {isVisibleToAll
                            ? "Available to all employees"
                            : assignedEmployees.length > 0
                              ? `${assignedEmployees.length} employee${assignedEmployees.length > 1 ? "s" : ""} assigned`
                              : "Unassigned"}
                        </p>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">Created</p>
                        <p className="text-sm">{formatDate(createdDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isPending && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="default"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleAcceptJob(job.id)}
                        disabled={updatingJobId === job.id}
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                        onClick={() => handleDeclineJob(job.id)}
                        disabled={updatingJobId === job.id}
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Job Completed!</span>
                      </div>
                    </div>
                  )}

                  {isDeclined && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">You declined this job</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </EmployeeLayout>
  )
}
