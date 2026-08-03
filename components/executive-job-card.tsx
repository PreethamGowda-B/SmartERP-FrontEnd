"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { JobCardHeader } from "@/components/job-card/job-card-header"
import { JobCardExecution } from "@/components/job-card/job-card-execution"
import { JobCardFinancials } from "@/components/job-card/job-card-financials"
import { JobCardActionToolbar } from "@/components/job-card/job-card-action-toolbar"
import { JobCardDrawer } from "@/components/job-card/job-card-drawer"
import { JobActionsModal } from "@/components/job-actions-modal"
import { OwnerEmergencyOverrideModal } from "@/components/owner-emergency-override-modal"
import { apiClient } from "@/lib/apiClient"

export interface ExecutiveJobCardProps {
  job: any
  role?: "owner" | "employee"
  onView?: (job: any) => void
  onEdit?: (job: any) => void
  onDelete?: (job: any) => void
  onActionComplete?: () => void
  showActions?: boolean
}

export function ExecutiveJobCard({
  job,
  role = "owner",
  onView,
  onEdit,
  onDelete,
  onActionComplete,
  showActions = true,
}: ExecutiveJobCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [isActionsOpen, setIsActionsOpen] = React.useState(false)
  const [isOverrideOpen, setIsOverrideOpen] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<any>(null)

  React.useEffect(() => {
    try {
      const u = apiClient.getUser()
      setCurrentUser(u)
    } catch (e) {
      // Session fallback
    }
  }, [])

  // Map crew members safely
  const crew = Array.isArray(job.assigned_crew)
    ? job.assigned_crew
    : Array.isArray(job.assignedEmployees)
    ? job.assignedEmployees.map((e: any) => (typeof e === "object" ? e : { id: e, name: "Crew" }))
    : []

  const currentUserId = currentUser?.id || currentUser?.userId
  const isAcceptedByCurrentUser =
    Boolean(currentUserId) &&
    ((job.accepted_by && String(job.accepted_by) === String(currentUserId)) ||
      (job.assigned_to && String(job.assigned_to) === String(currentUserId) && job.employee_status === "accepted"))

  const acceptedByName = job.accepted_by_name || job.assigned_employee_name || (job.employee_status === "accepted" ? "Technician" : null)

  return (
    <Card className="rounded-2xl border border-border/70 bg-card/95 backdrop-blur-xs hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* 1. Header Block */}
        <JobCardHeader
          id={String(job.id || "JOB-2026")}
          title={job.title || "Untitled Job"}
          client={job.client || job.customer_name || "Enterprise Client"}
          location={job.location}
          status={job.status || "open"}
          priority={job.priority || "normal"}
          startDate={job.startDate || job.created_at}
          assignedCrew={crew}
          role={role}
          onView={() => onView?.(job)}
          onEdit={() => onEdit?.(job)}
          onDelete={() => onDelete?.(job)}
        />

        {/* 2. Execution & Interactive Progress Block */}
        <JobCardExecution
          jobId={job.id}
          status={job.status || "open"}
          progress={job.progress || 0}
          estimatedHours={job.estimated_hours || 8}
          actualHours={job.spent_hours || 0}
          stage={job.stage}
          role={role}
          isAcceptedByCurrentUser={isAcceptedByCurrentUser}
          acceptedByName={acceptedByName}
          acceptedAt={job.accepted_at}
          onActionComplete={onActionComplete}
          onEmergencyOverride={() => setIsOverrideOpen(true)}
        />

        {/* 3. Financial Breakdown Block */}
        <JobCardFinancials
          invoice={job.invoice}
          budget={job.budget || job.estimated_cost}
          role={role}
        />

        {/* 4. Action Toolbar Block */}
        {showActions && (
          <JobCardActionToolbar
            job={job}
            role={role}
            isAcceptedByCurrentUser={isAcceptedByCurrentUser}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onActionComplete={onActionComplete}
            onOpenJobActions={() => setIsActionsOpen(true)}
            onEmergencyOverride={() => setIsOverrideOpen(true)}
          />
        )}

        {/* 5. Collapsible Breakdown Drawer */}
        <JobCardDrawer
          job={job}
          isOpen={isDrawerOpen}
          onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
        />
      </CardContent>

      {/* 6. Mounted Job Actions Modal for Accepted Technician */}
      <JobActionsModal
        jobId={job.id}
        jobTitle={job.title || "Job Action Request"}
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        onActionComplete={onActionComplete}
      />

      {/* 7. Mounted Emergency Override Modal for Owner Supervisory Intervention */}
      <OwnerEmergencyOverrideModal
        jobId={job.id}
        jobTitle={job.title || "Job Override"}
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        onActionComplete={onActionComplete}
      />
    </Card>
  )
}
