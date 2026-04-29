import type { JobStatus, EmployeeStatus } from '@/lib/customerTypes';

// approval_status values shown to customers
const APPROVAL_STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  pending_approval: { label: 'Pending Review',      className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   dot: 'bg-amber-500' },
  approved:         { label: 'Approved',             className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',      dot: 'bg-blue-500' },
  rejected:         { label: 'Not Approved',         className: 'bg-red-50 text-red-700 ring-1 ring-red-200',         dot: 'bg-red-500' },
};

// employee_status → customer-facing label (shown when job is approved)
const EMPLOYEE_STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  assigned:   { label: 'Assigning Technician', className: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200', dot: 'bg-purple-400 animate-pulse' },
  pending:    { label: 'Assigning Technician', className: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200', dot: 'bg-purple-400 animate-pulse' },
  accepted:   { label: 'Technician Assigned',  className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200', dot: 'bg-indigo-500' },
  arrived:    { label: 'Technician Arrived',   className: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',       dot: 'bg-teal-500' },
  declined:   { label: 'Reassigning...',       className: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200', dot: 'bg-orange-400 animate-pulse' },
  completed:  { label: 'Job Completed',        className: 'bg-green-50 text-green-700 ring-1 ring-green-200',    dot: 'bg-green-500' },
};

// job execution status values
const STATUS_CONFIG: Record<JobStatus, { label: string; className: string; dot: string }> = {
  open:        { label: 'Open',        className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',       dot: 'bg-blue-500' },
  pending:     { label: 'Pending',     className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',    dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', className: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200', dot: 'bg-orange-500' },
  active:      { label: 'In Progress', className: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200', dot: 'bg-orange-500' },
  completed:   { label: 'Completed',   className: 'bg-green-50 text-green-700 ring-1 ring-green-200',    dot: 'bg-green-500' },
  closed:      { label: 'Closed',      className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',      dot: 'bg-gray-400' },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-50 text-red-700 ring-1 ring-red-200',          dot: 'bg-red-500' },
};

interface JobStatusBadgeProps {
  status: JobStatus;
  approvalStatus?: string;
  employeeStatus?: EmployeeStatus | string;
}

export function JobStatusBadge({ status, approvalStatus, employeeStatus }: JobStatusBadgeProps) {
  // 1. Show approval status if not yet approved
  if (approvalStatus && approvalStatus !== 'approved') {
    const config = APPROVAL_STATUS_CONFIG[approvalStatus];
    if (config) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      );
    }
  }

  // 2. For completed/cancelled jobs, show execution status directly
  if (status === 'completed' || status === 'cancelled') {
    const config = STATUS_CONFIG[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  // 3. For approved jobs, show employee_status as the primary customer-facing state
  if (approvalStatus === 'approved' && employeeStatus && EMPLOYEE_STATUS_CONFIG[employeeStatus]) {
    const config = EMPLOYEE_STATUS_CONFIG[employeeStatus];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  // 4. Fallback to execution status
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
