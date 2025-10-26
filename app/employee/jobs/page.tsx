"use client"

import { useJobs } from "@/contexts/job-context"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Users } from "lucide-react"

function getStatusColor(status?: string) {
  const normalizedStatus = status?.toLowerCase() || "pending"
  switch (normalizedStatus) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "in progress":
      return "bg-blue-100 text-blue-800"
    case "pending":
    default:
      return "bg-yellow-100 text-yellow-800"
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
  const { jobs } = useJobs()

  if (jobs.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>
        <p className="text-gray-500 text-center py-12">No jobs available yet.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const status = job.status || "Pending"
          const progress = job.progress ?? 0
          const createdDate = job.created_at || job.createdAt
          const isVisibleToAll = job.visible_to_all || false
          const assignedEmployees = job.assignedEmployees || []

          return (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
            >
              {/* Header with title and status badge */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2">{job.title}</h2>
                  <Badge className={`${getStatusColor(status)} whitespace-nowrap flex-shrink-0`}>{status}</Badge>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 pt-3 pb-2">
                <p className="text-sm text-gray-600 line-clamp-2">{job.description || "No description provided"}</p>
              </div>

              {/* Progress section */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Progress</span>
                  <span className="text-xs font-semibold text-gray-900">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Footer with assignment and date info */}
              <div className="px-4 py-3 border-t border-gray-100 space-y-2 flex-1 flex flex-col justify-end">
                {/* Assignment info */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {isVisibleToAll
                      ? "Visible to all employees"
                      : assignedEmployees.length > 0
                        ? `Assigned to ${assignedEmployees.length} employee${assignedEmployees.length > 1 ? "s" : ""}`
                        : "Unassigned"}
                  </span>
                </div>

                {/* Date info */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Created: {formatDate(createdDate)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
