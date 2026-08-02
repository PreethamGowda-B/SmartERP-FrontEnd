"use client"

import { ExecutiveJobCard, type ExecutiveJobCardProps } from "@/components/executive-job-card"
import { type Job } from "@/lib/data"

interface JobCardProps {
  job: Job | any
  role?: "owner" | "employee"
  onEdit?: (job: any) => void
  onDelete?: (job: any) => void
  onView?: (job: any) => void
  showActions?: boolean
}

export function JobCard({ job, role = "owner", onEdit, onDelete, onView, showActions = true }: JobCardProps) {
  return (
    <ExecutiveJobCard
      job={job}
      role={role}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      showActions={showActions}
    />
  )
}

