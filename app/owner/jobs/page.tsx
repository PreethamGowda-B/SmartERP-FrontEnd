"use client"

import { useState } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { JobCard } from "@/components/job-card"
import { JobForm } from "@/components/job-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Job } from "@/lib/data"
import { useJobs } from "@/contexts/job-context"
import { Plus, Search, Filter } from "lucide-react"

export default function OwnerJobsPage() {
  const { jobs, addJob, updateJob, deleteJob } = useJobs()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesPriority = priorityFilter === "all" || job.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleCreateJob = () => {
    setEditingJob(null)
    setIsFormOpen(true)
  }

  const handleEditJob = (job: Job) => {
    setEditingJob(job)
    setIsFormOpen(true)
  }

  const handleDeleteJob = (job: Job) => {
    if (confirm("Are you sure you want to delete this job?")) {
      deleteJob(job.id)
    }
  }

  const handleSubmitJob = async (jobData: Partial<Job>) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (editingJob) {
      updateJob(editingJob.id, jobData)
    } else {
      const newJob: Job = {
        id: Date.now().toString(),
        spent: 0,
        ...jobData,
      } as Job
      addJob(newJob)
    }

    setIsLoading(false)
    setIsFormOpen(false)
    setEditingJob(null)
  }

  const handleCancelForm = () => {
    setIsFormOpen(false)
    setEditingJob(null)
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Job Management</h1>
            <p className="text-muted-foreground">Manage all your construction projects and assignments</p>
          </div>
          <Button onClick={handleCreateJob}>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-primary">{jobs.filter((j) => j.status === "active").length}</div>
            <div className="text-sm text-muted-foreground">Active Jobs</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-accent">{jobs.filter((j) => j.status === "pending").length}</div>
            <div className="text-sm text-muted-foreground">Pending Jobs</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter((j) => j.status === "completed").length}
            </div>
            <div className="text-sm text-muted-foreground">Completed Jobs</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-destructive">
              {jobs.filter((j) => j.priority === "high").length}
            </div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} onEdit={handleEditJob} onDelete={handleDeleteJob} />
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No jobs found matching your criteria.</p>
          </div>
        )}

        {/* Job Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? "Edit Job" : "Create New Job"}</DialogTitle>
            </DialogHeader>
            <JobForm
              job={editingJob || undefined}
              onSubmit={handleSubmitJob}
              onCancel={handleCancelForm}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
