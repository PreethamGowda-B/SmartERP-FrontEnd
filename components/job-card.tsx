"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { type Job, mockEmployees } from "@/lib/data"
import { MapPin, Calendar, Users, DollarSign, Edit, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"

interface JobCardProps {
  job: Job
  onEdit?: (job: Job) => void
  onDelete?: (job: Job) => void
  onView?: (job: Job) => void
  showActions?: boolean
}

export function JobCard({ job, onEdit, onDelete, onView, showActions = true }: JobCardProps) {
  const progress = (job.spent / job.budget) * 100
  const assignedEmployeeDetails = mockEmployees.filter((emp) =>
    job.assignedEmployees.includes(emp.id)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "pending":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  // ✅ Safe formatter for dates
  const renderStartDate = () => {
    if (!job.startDate) return "No start date"
    const d = new Date(job.startDate)
    if (isNaN(d.getTime())) return "Invalid date"
    return format(d, "MMM dd, yyyy")
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <CardDescription>{job.client}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
            <Badge variant={getPriorityColor(job.priority)}>{job.priority}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {job.location}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{renderStartDate()}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${job.budget.toLocaleString()}</span>
          </div>
        </div>

        {job.status === "active" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${job.spent.toLocaleString()} spent</span>
              <span>${(job.budget - job.spent).toLocaleString()} remaining</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Assigned Team ({assignedEmployeeDetails.length})</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {assignedEmployeeDetails.slice(0, 3).map((employee) => (
              <div key={employee.id} className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {employee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{employee.name.split(" ")[0]}</span>
              </div>
            ))}
            {assignedEmployeeDetails.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{assignedEmployeeDetails.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(job)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(job)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={() => onDelete(job)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
